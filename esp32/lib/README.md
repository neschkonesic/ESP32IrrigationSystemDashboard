# ESP32 Irrigation System Libraries

This directory contains additional libraries and utilities for the ESP32 irrigation system.

## Custom Libraries

### SensorManager
Handles all sensor readings and calibration.

### IrrigationController
Manages valve operations and irrigation scheduling.

### NetworkManager
Handles WiFi and MQTT connections with auto-reconnect.

### DataLogger
Logs sensor data to SD card or cloud storage.

## Third-party Libraries

All required libraries are automatically installed via PlatformIO based on the `platformio.ini` configuration.

### Required Libraries:
- **ArduinoJson** - JSON parsing and generation
- **DHT sensor library** - DHT22 temperature/humidity sensor
- **Adafruit BMP280 Library** - Pressure sensor
- **PubSubClient** - MQTT client
- **WebSockets** - WebSocket server implementation

### Optional Libraries:
- **SD** - For data logging to SD card
- **NTPClient** - Network time synchronization
- **OTA** - Over-the-air firmware updates