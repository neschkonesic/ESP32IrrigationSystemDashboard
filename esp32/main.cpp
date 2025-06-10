#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <Wire.h>
#include <BMP280.h>
#include <PubSubClient.h>
#include <EEPROM.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* mqtt_server = "192.168.1.100"; // Change to your MQTT broker IP
const int mqtt_port = 1883;
const char* mqtt_user = "esp32_irrigation";
const char* mqtt_password = "irrigation123";

// Pin definitions
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define VALVE1_PIN 16
#define VALVE2_PIN 17
#define SOIL_MOISTURE_PIN 34
#define WIND_SPEED_PIN 35
#define LIGHT_SENSOR_PIN 32
#define CO2_SENSOR_PIN 33
#define FAN_PWM_PIN 25
#define EXTERNAL_TEMP_PIN 26

// PWM settings for fan
#define PWM_FREQ 5000
#define PWM_CHANNEL 0
#define PWM_RESOLUTION 8

// Sensor objects
DHT dht(DHT_PIN, DHT_TYPE);
BMP280 bmp;
WiFiClient espClient;
PubSubClient mqttClient(espClient);
WebSocketsServer webSocket = WebSocketsServer(81);

// System variables
struct SystemData {
  float temperature;
  float pressure;
  float soilMoisture;
  float windSpeed;
  float lightIntensity;
  float co2Saturation;
  float externalTemperature;
  bool valve1State;
  bool valve2State;
  bool wifiConnected;
  bool mqttConnected;
  bool systemActive;
  float targetTemperature;
  int fanSpeed;
  bool autoMode;
  unsigned long lastUpdate;
} systemData;

// EEPROM addresses for persistent storage
#define EEPROM_SIZE 64
#define TARGET_TEMP_ADDR 0
#define FAN_SPEED_ADDR 4
#define AUTO_MODE_ADDR 8

void setup() {
  Serial.begin(115200);
  
  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);
  
  // Initialize pins
  pinMode(VALVE1_PIN, OUTPUT);
  pinMode(VALVE2_PIN, OUTPUT);
  pinMode(SOIL_MOISTURE_PIN, INPUT);
  pinMode(WIND_SPEED_PIN, INPUT);
  pinMode(LIGHT_SENSOR_PIN, INPUT);
  pinMode(CO2_SENSOR_PIN, INPUT);
  pinMode(EXTERNAL_TEMP_PIN, INPUT);
  
  // Initialize PWM for fan control
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(FAN_PWM_PIN, PWM_CHANNEL);
  
  // Initialize sensors
  dht.begin();
  Wire.begin();
  
  if (!bmp.begin()) {
    Serial.println("BMP280 sensor not found!");
  }
  
  // Load saved settings from EEPROM
  loadSettings();
  
  // Initialize system data
  systemData.valve1State = false;
  systemData.valve2State = false;
  systemData.systemActive = true;
  systemData.wifiConnected = false;
  systemData.mqttConnected = false;
  systemData.lastUpdate = 0;
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  
  // Initialize WebSocket
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  
  Serial.println("ESP32 Irrigation System initialized!");
}

void loop() {
  // Handle WebSocket connections
  webSocket.loop();
  
  // Handle MQTT connection
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();
  
  // Read sensors every 2 seconds
  if (millis() - systemData.lastUpdate > 2000) {
    readSensors();
    
    // Automatic control logic
    if (systemData.autoMode) {
      automaticControl();
    }
    
    // Send data via WebSocket and MQTT
    sendSensorData();
    systemData.lastUpdate = millis();
  }
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    systemData.wifiConnected = false;
    connectToWiFi();
  } else {
    systemData.wifiConnected = true;
  }
  
  delay(100);
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("Connected to WiFi. IP address: ");
    Serial.println(WiFi.localIP());
    systemData.wifiConnected = true;
  } else {
    Serial.println();
    Serial.println("Failed to connect to WiFi");
    systemData.wifiConnected = false;
  }
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    if (mqttClient.connect("ESP32_Irrigation", mqtt_user, mqtt_password)) {
      Serial.println("connected");
      systemData.mqttConnected = true;
      
      // Subscribe to control topics
      mqttClient.subscribe("irrigation/control/valve1");
      mqttClient.subscribe("irrigation/control/valve2");
      mqttClient.subscribe("irrigation/control/target_temp");
      mqttClient.subscribe("irrigation/control/fan_speed");
      mqttClient.subscribe("irrigation/control/auto_mode");
      
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      systemData.mqttConnected = false;
      delay(5000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.print("MQTT message received [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);
  
  // Handle control commands
  if (String(topic) == "irrigation/control/valve1") {
    systemData.valve1State = (message == "true");
    digitalWrite(VALVE1_PIN, systemData.valve1State);
  }
  else if (String(topic) == "irrigation/control/valve2") {
    systemData.valve2State = (message == "true");
    digitalWrite(VALVE2_PIN, systemData.valve2State);
  }
  else if (String(topic) == "irrigation/control/target_temp") {
    systemData.targetTemperature = message.toFloat();
    saveSettings();
  }
  else if (String(topic) == "irrigation/control/fan_speed") {
    systemData.fanSpeed = message.toInt();
    setFanSpeed(systemData.fanSpeed);
    saveSettings();
  }
  else if (String(topic) == "irrigation/control/auto_mode") {
    systemData.autoMode = (message == "true");
    saveSettings();
  }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[%u] Disconnected!\n", num);
      break;
      
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
      
      // Send current data to newly connected client
      sendSensorDataToClient(num);
      break;
    }
    
    case WStype_TEXT: {
      Serial.printf("[%u] Received: %s\n", num, payload);
      
      // Parse JSON command
      DynamicJsonDocument doc(1024);
      deserializeJson(doc, payload);
      
      if (doc["command"] == "toggle_valve1") {
        systemData.valve1State = !systemData.valve1State;
        digitalWrite(VALVE1_PIN, systemData.valve1State);
      }
      else if (doc["command"] == "toggle_valve2") {
        systemData.valve2State = !systemData.valve2State;
        digitalWrite(VALVE2_PIN, systemData.valve2State);
      }
      else if (doc["command"] == "set_target_temp") {
        systemData.targetTemperature = doc["value"];
        saveSettings();
      }
      else if (doc["command"] == "set_fan_speed") {
        systemData.fanSpeed = doc["value"];
        setFanSpeed(systemData.fanSpeed);
        saveSettings();
      }
      else if (doc["command"] == "set_auto_mode") {
        systemData.autoMode = doc["value"];
        saveSettings();
      }
      
      break;
    }
    
    default:
      break;
  }
}

void readSensors() {
  // Read DHT22 sensor (internal temperature and humidity)
  systemData.temperature = dht.readTemperature();
  if (isnan(systemData.temperature)) {
    systemData.temperature = 22.5; // Default value if sensor fails
  }
  
  // Read BMP280 sensor (pressure)
  systemData.pressure = bmp.readPressure() / 100000.0; // Convert to bar
  if (isnan(systemData.pressure)) {
    systemData.pressure = 1.013; // Default atmospheric pressure
  }
  
  // Read analog sensors
  int soilMoistureRaw = analogRead(SOIL_MOISTURE_PIN);
  systemData.soilMoisture = map(soilMoistureRaw, 0, 4095, 0, 100);
  
  int windSpeedRaw = analogRead(WIND_SPEED_PIN);
  systemData.windSpeed = map(windSpeedRaw, 0, 4095, 0, 50); // 0-50 km/h range
  
  int lightRaw = analogRead(LIGHT_SENSOR_PIN);
  systemData.lightIntensity = map(lightRaw, 0, 4095, 0, 100);
  
  int co2Raw = analogRead(CO2_SENSOR_PIN);
  systemData.co2Saturation = map(co2Raw, 0, 4095, 300, 600); // 300-600 ppm range
  
  int extTempRaw = analogRead(EXTERNAL_TEMP_PIN);
  systemData.externalTemperature = map(extTempRaw, 0, 4095, -20, 50); // -20 to 50°C range
  
  // Add some realistic variation to simulated sensors
  systemData.windSpeed += (random(-100, 100) / 100.0);
  systemData.lightIntensity += (random(-500, 500) / 100.0);
  systemData.co2Saturation += (random(-1000, 1000) / 100.0);
  
  // Constrain values to realistic ranges
  systemData.soilMoisture = constrain(systemData.soilMoisture, 0, 100);
  systemData.windSpeed = constrain(systemData.windSpeed, 0, 50);
  systemData.lightIntensity = constrain(systemData.lightIntensity, 0, 100);
  systemData.co2Saturation = constrain(systemData.co2Saturation, 300, 600);
}

void automaticControl() {
  float tempDiff = systemData.temperature - systemData.targetTemperature;
  
  // Temperature-based valve control
  if (tempDiff > 2.0) {
    // Too hot - open valves for cooling
    systemData.valve1State = true;
    systemData.valve2State = true;
  } else if (tempDiff < -2.0) {
    // Too cold - close valves
    systemData.valve1State = false;
    systemData.valve2State = false;
  }
  
  // Soil moisture-based irrigation
  if (systemData.soilMoisture < 30) {
    systemData.valve1State = true; // Emergency irrigation
  }
  
  // Automatic fan speed control
  if (tempDiff > 3.0) {
    systemData.fanSpeed = 80;
  } else if (tempDiff > 1.0) {
    systemData.fanSpeed = 60;
  } else if (tempDiff < -3.0) {
    systemData.fanSpeed = 20;
  } else if (tempDiff < -1.0) {
    systemData.fanSpeed = 30;
  } else {
    systemData.fanSpeed = 45; // Default moderate speed
  }
  
  // Reduce fan speed in high wind conditions
  if (systemData.windSpeed > 15) {
    systemData.fanSpeed = min(systemData.fanSpeed, 20);
  }
  
  // Apply valve states
  digitalWrite(VALVE1_PIN, systemData.valve1State);
  digitalWrite(VALVE2_PIN, systemData.valve2State);
  
  // Apply fan speed
  setFanSpeed(systemData.fanSpeed);
}

void setFanSpeed(int speed) {
  int pwmValue = map(speed, 0, 100, 0, 255);
  ledcWrite(PWM_CHANNEL, pwmValue);
}

void sendSensorData() {
  DynamicJsonDocument doc(1024);
  
  doc["temperature"] = systemData.temperature;
  doc["pressure"] = systemData.pressure;
  doc["soilMoisture"] = systemData.soilMoisture;
  doc["windSpeed"] = systemData.windSpeed;
  doc["lightIntensity"] = systemData.lightIntensity;
  doc["co2Saturation"] = systemData.co2Saturation;
  doc["externalTemperature"] = systemData.externalTemperature;
  doc["valve1"] = systemData.valve1State;
  doc["valve2"] = systemData.valve2State;
  doc["wifiConnected"] = systemData.wifiConnected;
  doc["mqttConnected"] = systemData.mqttConnected;
  doc["systemActive"] = systemData.systemActive;
  doc["targetTemperature"] = systemData.targetTemperature;
  doc["fanSpeed"] = systemData.fanSpeed;
  doc["autoMode"] = systemData.autoMode;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send via WebSocket to all connected clients
  webSocket.broadcastTXT(jsonString);
  
  // Send via MQTT
  if (mqttClient.connected()) {
    mqttClient.publish("irrigation/sensors/data", jsonString.c_str());
  }
}

void sendSensorDataToClient(uint8_t clientNum) {
  DynamicJsonDocument doc(1024);
  
  doc["temperature"] = systemData.temperature;
  doc["pressure"] = systemData.pressure;
  doc["soilMoisture"] = systemData.soilMoisture;
  doc["windSpeed"] = systemData.windSpeed;
  doc["lightIntensity"] = systemData.lightIntensity;
  doc["co2Saturation"] = systemData.co2Saturation;
  doc["externalTemperature"] = systemData.externalTemperature;
  doc["valve1"] = systemData.valve1State;
  doc["valve2"] = systemData.valve2State;
  doc["wifiConnected"] = systemData.wifiConnected;
  doc["mqttConnected"] = systemData.mqttConnected;
  doc["systemActive"] = systemData.systemActive;
  doc["targetTemperature"] = systemData.targetTemperature;
  doc["fanSpeed"] = systemData.fanSpeed;
  doc["autoMode"] = systemData.autoMode;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  webSocket.sendTXT(clientNum, jsonString);
}

void saveSettings() {
  EEPROM.writeFloat(TARGET_TEMP_ADDR, systemData.targetTemperature);
  EEPROM.writeInt(FAN_SPEED_ADDR, systemData.fanSpeed);
  EEPROM.writeBool(AUTO_MODE_ADDR, systemData.autoMode);
  EEPROM.commit();
}

void loadSettings() {
  systemData.targetTemperature = EEPROM.readFloat(TARGET_TEMP_ADDR);
  systemData.fanSpeed = EEPROM.readInt(FAN_SPEED_ADDR);
  systemData.autoMode = EEPROM.readBool(AUTO_MODE_ADDR);
  
  // Set default values if EEPROM is empty
  if (isnan(systemData.targetTemperature) || systemData.targetTemperature < 10 || systemData.targetTemperature > 40) {
    systemData.targetTemperature = 24.0;
  }
  if (systemData.fanSpeed < 0 || systemData.fanSpeed > 100) {
    systemData.fanSpeed = 45;
  }
}