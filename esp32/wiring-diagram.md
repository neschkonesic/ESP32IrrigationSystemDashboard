# ESP32 Irrigation System - Wiring Diagram

## ESP32 DevKit v1 Pinout

```
                    ESP32 DevKit v1
                   ┌─────────────────┐
                   │                 │
               3V3 │●               ●│ VIN (5V)
               GND │●               ●│ GND
                15 │●               ●│ 13
                 2 │●               ●│ 12
                 0 │●               ●│ 14
                 4 │●               ●│ 27  
                16 │●               ●│ 26
                17 │●               ●│ 25
                 5 │●               ●│ 33
                18 │●               ●│ 32
                19 │●               ●│ 35
                21 │●               ●│ 34
                 3 │●               ●│ 39
                 1 │●               ●│ 36
               GND │●               ●│ EN
                   │                 │
                   └─────────────────┘
                          USB
```

## Complete Wiring Connections

### Power Distribution
```
ESP32 Power:
┌─ VIN (5V) ←── External 5V Power Supply
├─ 3V3 ────────→ Sensor Power Rail
└─ GND ────────→ Common Ground Rail

Power Supply Requirements:
• 5V/3A minimum for ESP32 + sensors + relays
• 12V/2A for irrigation valves (if 12V valves used)
• Separate power domains for logic and actuators
```

### Sensor Connections

#### 1. DHT22 Temperature/Humidity Sensor
```
DHT22 Pinout:     ESP32 Connection:
┌─────────────┐   
│ 1  2  3  4  │   Pin 1 (VCC) → 3V3
└─────────────┘   Pin 2 (Data) → GPIO 4
                  Pin 3 (NC) → Not Connected
                  Pin 4 (GND) → GND
                  
Add 10kΩ pull-up resistor between Data and VCC
```

#### 2. BMP280 Pressure Sensor (I2C)
```
BMP280 Pinout:    ESP32 Connection:
┌─────────────┐   
│VCC SDA SCL  │   VCC → 3V3
│GND CSB SDO  │   GND → GND
└─────────────┘   SDA → GPIO 21 (SDA)
                  SCL → GPIO 22 (SCL)
                  CSB → 3V3 (I2C mode)
                  SDO → GND (Address 0x76)
```

#### 3. Soil Moisture Sensor (Analog)
```
Soil Sensor:      ESP32 Connection:
┌─────────────┐   
│ VCC GND AO  │   VCC → 3V3
└─────────────┘   GND → GND
                  AO → GPIO 34 (ADC1_CH6)
                  
Note: Use capacitive soil sensor for better longevity
```

#### 4. Wind Speed Sensor (Analog Anemometer)
```
Anemometer:       ESP32 Connection:
┌─────────────┐   
│ RED BLK WHT │   RED → 3V3
└─────────────┘   BLK → GND
                  WHT → GPIO 35 (ADC1_CH7)
                  
Add 10kΩ pull-down resistor on signal line
```

#### 5. Light Sensor (LDR)
```
LDR Circuit:      ESP32 Connection:
    3V3
     │
   ┌─┴─┐ 10kΩ
   │   │
   └─┬─┘
     │ ────────→ GPIO 32 (ADC1_CH4)
   ┌─┴─┐ LDR
   │   │
   └─┬─┘
     │
    GND
```

#### 6. CO2 Sensor (MQ-135)
```
MQ-135 Pinout:    ESP32 Connection:
┌─────────────┐   
│ VCC GND AO  │   VCC → 5V (requires 5V!)
│     DO      │   GND → GND
└─────────────┘   AO → GPIO 33 (ADC1_CH5)
                  DO → Not used
                  
Note: Use voltage divider for 3.3V compatibility:
AO → 2.2kΩ → GPIO 33
      │
    3.3kΩ
      │
     GND
```

#### 7. External Temperature Sensor (DS18B20)
```
DS18B20 Pinout:   ESP32 Connection:
┌─────────────┐   
│ GND DQ VDD  │   GND → GND
└─────────────┘   DQ → GPIO 26
                  VDD → 3V3
                  
Add 4.7kΩ pull-up resistor between DQ and VDD
```

### Actuator Connections

#### 1. Irrigation Valves (via Relays)
```
Relay Module:     ESP32 Connection:
┌─────────────┐   
│VCC GND IN1  │   VCC → 5V
│    IN2      │   GND → GND
└─────────────┘   IN1 → GPIO 16 (Valve 1)
                  IN2 → GPIO 17 (Valve 2)

Valve Wiring:
Power Supply (+) → Relay COM
Relay NO → Valve (+)
Valve (-) → Power Supply (-)

Safety: Use optocoupler relays rated for valve voltage/current
```

#### 2. Ventilation Fan (PWM Control)
```
MOSFET Driver:    ESP32 Connection:
┌─────────────┐   
│ VCC GND PWM │   VCC → 3V3
└─────────────┘   GND → GND
                  PWM → GPIO 25

MOSFET Circuit (IRF520):
GPIO 25 → 1kΩ → MOSFET Gate
MOSFET Source → GND
MOSFET Drain → Fan (-)
Fan (+) → 12V Power Supply
```

## Complete System Wiring Diagram

```
                    ┌─────────────────────────────────────┐
                    │           ESP32 DevKit v1           │
                    │                                     │
    DHT22 ──────────┤ GPIO 4                              │
    BMP280 SDA ─────┤ GPIO 21                             │
    BMP280 SCL ─────┤ GPIO 22                             │
    Soil Sensor ────┤ GPIO 34                             │
    Wind Sensor ────┤ GPIO 35                             │
    Light Sensor ───┤ GPIO 32                             │
    CO2 Sensor ─────┤ GPIO 33                             │
    Ext Temp ───────┤ GPIO 26                             │
    Valve 1 Relay ──┤ GPIO 16                             │
    Valve 2 Relay ──┤ GPIO 17                             │
    Fan PWM ────────┤ GPIO 25                             │
                    │                                     │
    5V Power ───────┤ VIN                            3V3  ├─── Sensors VCC
    Ground ─────────┤ GND                            GND  ├─── Common Ground
                    └─────────────────────────────────────┘
```

## Power Supply Schematic

```
AC 220V ──┐
          │   ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
          └──→│ AC/DC 5V/3A │───→│ ESP32 + Logic│    │             │
              └─────────────┘    └──────────────┘    │             │
                                                     │   Relay     │
              ┌─────────────┐    ┌──────────────┐    │   Module    │
AC 220V ─────→│ AC/DC 12V/2A│───→│ Valve Power  │───→│             │
              └─────────────┘    └──────────────┘    └─────────────┘
                                                            │
                                                            ▼
                                                    ┌─────────────┐
                                                    │ Irrigation  │
                                                    │   Valves    │
                                                    └─────────────┘
```

## PCB Layout Recommendations

### Component Placement
```
┌─────────────────────────────────────────────────────┐
│  ┌─────────┐    ┌──────────┐    ┌─────────────────┐ │
│  │ ESP32   │    │ Relay    │    │ Power Supply    │ │
│  │ DevKit  │    │ Module   │    │ Terminals       │ │
│  └─────────┘    └──────────┘    └─────────────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │           Sensor Terminals                      │ │
│  │  DHT22  BMP280  Soil  Wind  Light  CO2  ExtT   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────────┐ │
│  │           Status LEDs                           │ │
│  │   WiFi   MQTT   Valve1   Valve2   System       │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Installation Guidelines

### Enclosure Requirements
- **IP65 rated** for outdoor installation
- **Ventilation** for heat dissipation
- **Cable glands** for weatherproof connections
- **DIN rail mounting** for professional installation

### Sensor Placement
- **DHT22**: Inside greenhouse, shaded location
- **BMP280**: Protected from direct moisture
- **Soil sensors**: Buried at root depth (15-20cm)
- **Wind sensor**: Open area, 2m height minimum
- **Light sensor**: Unobstructed sky view
- **CO2 sensor**: Plant canopy level

### Safety Considerations
⚠️ **IMPORTANT SAFETY NOTES:**
- Use **GFCI/RCD protection** for all AC circuits
- **Separate low voltage** (sensors) from high voltage (valves)
- **Proper grounding** of all metal components
- **Fused protection** for each power rail
- **Emergency stop switch** for manual override
- **Regular inspection** of all connections

### Maintenance Access
- **Test points** for voltage measurements
- **LED indicators** for system status
- **Removable terminals** for easy servicing
- **Spare I/O pins** for future expansion

## Troubleshooting Connection Issues

### Common Problems:
1. **Sensor readings erratic** → Check power supply stability
2. **Relays not switching** → Verify 5V power to relay module
3. **WiFi connection drops** → Check antenna placement
4. **I2C sensors not detected** → Verify SDA/SCL connections
5. **Analog readings noisy** → Add filtering capacitors

### Testing Procedure:
1. **Power check**: Verify all voltage rails
2. **Sensor test**: Read each sensor individually
3. **Actuator test**: Manual control of valves/fan
4. **Communication test**: WebSocket and MQTT connectivity
5. **System integration**: Full automatic mode testing