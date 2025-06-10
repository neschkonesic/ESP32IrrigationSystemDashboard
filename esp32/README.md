# ESP32 Irrigation System

## Hardware Requirements

### ESP32 Development Board
- ESP32 DevKit v1 or similar
- USB cable for programming and power

### Sensors
- **DHT22** - Temperature and humidity sensor (Pin 4)
- **BMP280** - Barometric pressure sensor (I2C: SDA=21, SCL=22)
- **Soil Moisture Sensor** - Analog sensor (Pin 34)
- **Wind Speed Sensor** - Analog anemometer (Pin 35)
- **Light Sensor (LDR)** - Light dependent resistor (Pin 32)
- **CO2 Sensor (MQ-135)** - Air quality sensor (Pin 33)
- **External Temperature Sensor** - Additional temperature probe (Pin 26)

### Actuators
- **Valve 1** - Main irrigation valve (Pin 16)
- **Valve 2** - Secondary irrigation valve (Pin 17)
- **Fan** - Ventilation fan with PWM control (Pin 25)

### Additional Components
- **Relays** - For valve control (5V relays recommended)
- **MOSFET** - For fan PWM control (IRF520 or similar)
- **Pull-up resistors** - 10kΩ for digital inputs
- **Power supply** - 5V/12V depending on valves and fan requirements

## Wiring Diagram

```
ESP32 Pin Connections:
├── Pin 4  → DHT22 Data
├── Pin 16 → Valve 1 Relay
├── Pin 17 → Valve 2 Relay
├── Pin 21 → BMP280 SDA
├── Pin 22 → BMP280 SCL
├── Pin 25 → Fan PWM (via MOSFET)
├── Pin 26 → External Temperature Sensor
├── Pin 32 → Light Sensor (LDR)
├── Pin 33 → CO2 Sensor (MQ-135)
├── Pin 34 → Soil Moisture Sensor
└── Pin 35 → Wind Speed Sensor

Power Connections:
├── 3.3V → Sensors VCC
├── 5V   → Relays VCC
├── GND  → Common Ground
└── VIN  → External Power Input
```

## Software Setup

### 1. Install PlatformIO
```bash
# Install PlatformIO Core
pip install platformio

# Or use PlatformIO IDE extension in VS Code
```

### 2. Configure WiFi and MQTT
Edit the following lines in `main.cpp`:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "192.168.1.100"; // Your MQTT broker IP
```

### 3. Upload Code
```bash
# Build and upload
pio run --target upload

# Monitor serial output
pio device monitor
```

## Communication Protocols

### WebSocket (Port 81)
Real-time bidirectional communication with the web dashboard.

**Commands to ESP32:**
```json
{"command": "toggle_valve1"}
{"command": "toggle_valve2"}
{"command": "set_target_temp", "value": 25.0}
{"command": "set_fan_speed", "value": 60}
{"command": "set_auto_mode", "value": true}
```

**Data from ESP32:**
```json
{
  "temperature": 22.5,
  "pressure": 1.2,
  "soilMoisture": 45,
  "windSpeed": 8.3,
  "lightIntensity": 75,
  "co2Saturation": 420,
  "externalTemperature": 18.7,
  "valve1": false,
  "valve2": true,
  "wifiConnected": true,
  "mqttConnected": true,
  "systemActive": true,
  "targetTemperature": 24.0,
  "fanSpeed": 45,
  "autoMode": false,
  "timestamp": 123456789
}
```

### MQTT Topics

**Subscribe (Control):**
- `irrigation/control/valve1` - Control valve 1 (true/false)
- `irrigation/control/valve2` - Control valve 2 (true/false)
- `irrigation/control/target_temp` - Set target temperature (float)
- `irrigation/control/fan_speed` - Set fan speed (0-100)
- `irrigation/control/auto_mode` - Enable/disable auto mode (true/false)

**Publish (Data):**
- `irrigation/sensors/data` - All sensor data (JSON)

## Automatic Control Logic

### Temperature Control
- **Too Hot (>2°C above target):** Open both valves, increase fan speed
- **Too Cold (<2°C below target):** Close valves, reduce fan speed
- **Optimal (±1°C from target):** Maintain current settings

### Irrigation Control
- **Critical Dry (<30% soil moisture):** Emergency irrigation
- **Low Moisture (<50%):** Regular irrigation schedule
- **Adequate (>50%):** No irrigation needed

### Fan Control
- **High Temperature Difference:** 60-80% speed
- **Normal Conditions:** 30-45% speed
- **High Wind (>15 km/h):** Reduce to 20% maximum

### Safety Features
- **WiFi Disconnection:** Continue with last known settings
- **Sensor Failure:** Use default safe values
- **MQTT Disconnection:** Fall back to WebSocket control
- **Power Loss:** Resume with saved settings from EEPROM

## Troubleshooting

### Common Issues

1. **WiFi Connection Failed**
   - Check SSID and password
   - Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
   - Check signal strength

2. **Sensor Readings Invalid**
   - Verify wiring connections
   - Check power supply voltage
   - Test sensors individually

3. **MQTT Connection Issues**
   - Verify broker IP address and port
   - Check firewall settings
   - Ensure broker is running

4. **WebSocket Connection Problems**
   - Check if port 81 is open
   - Verify ESP32 IP address
   - Test with WebSocket client tools

### Serial Monitor Output
Monitor the serial output at 115200 baud for debugging information:
```
ESP32 Irrigation System initialized!
Connecting to WiFi.....
Connected to WiFi. IP address: 192.168.1.150
Attempting MQTT connection...connected
[0] Connected from 192.168.1.100 url: /
```

## Maintenance

### Regular Tasks
- **Weekly:** Check sensor calibration
- **Monthly:** Clean sensors and connections
- **Seasonally:** Update target parameters
- **Annually:** Replace sensor batteries/components

### Firmware Updates
1. Backup current settings via MQTT/WebSocket
2. Upload new firmware via PlatformIO
3. Restore settings if needed
4. Test all functions

## Safety Considerations

⚠️ **Important Safety Notes:**
- Use appropriate relays rated for your valve voltage/current
- Ensure proper electrical isolation between ESP32 and high-voltage components
- Install fuses/circuit breakers for protection
- Use weatherproof enclosures for outdoor installation
- Regular maintenance of electrical connections
- Emergency manual override for critical systems