# Firmware

ESP32 firmware for CityWag Smart Cabin 0.1. It reads SHT31 and MPU6050 over I2C, calculates cabin comfort and travel state, prints JSON to Serial Monitor, and notifies the same JSON through BLE.

## Hardware Wiring

Default ESP32 I2C pins:

| ESP32 | SHT31 | MPU6050 |
| --- | --- | --- |
| GPIO21 SDA | SDA | SDA |
| GPIO22 SCL | SCL | SCL |
| 3V3 | VCC | VCC |
| GND | GND | GND |

Both sensors share the I2C bus. Most SHT31 modules use `0x44`; some can be configured to `0x45`. Most MPU6050 modules use `0x68`; AD0 can change it to `0x69`.

## PlatformIO

```bash
cd firmware
pio run
pio run --target upload
pio device monitor
```

Serial Monitor baud rate: `115200`.

## Arduino IDE Alternative

1. Install ESP32 board support in Arduino IDE.
2. Install these libraries through Library Manager:
   - Adafruit SHT31 Library
   - Adafruit MPU6050
   - Adafruit Unified Sensor
   - ArduinoJson
3. ESP32 BLE Arduino headers are included with common ESP32 Arduino core installs.
4. Copy `src/main.cpp` into an Arduino sketch.
5. Select your ESP32 board and upload.

If PlatformIO cannot resolve a library name, install the same library manually through the PlatformIO Library UI or use the library search result for the exact current registry name.

## Sensor Bring-Up

Test SHT31 first:

1. Wire only SHT31 to GPIO21, GPIO22, 3V3, and GND.
2. Flash firmware.
3. Open Serial Monitor.
4. Confirm `SHT31 detected at 0x44`.

Test MPU6050 next:

1. Wire only MPU6050.
2. Flash firmware.
3. Confirm `MPU6050 detected at 0x68`.

Test both sensors and BLE last:

1. Wire both modules to the shared I2C bus.
2. Flash firmware.
3. Confirm JSON prints every second even before BLE connects.
4. Connect from the web demo.

## Common Issues

`SHT31 not found`:

- Check SDA/SCL are not swapped.
- Check 3V3 and GND.
- Try SHT31 address `0x45` if your module is configured that way.

`MPU6050 not found`:

- Check SDA/SCL, 3V3, and GND.
- Try address `0x69` if AD0 is pulled high.

I2C address problems:

- Run an I2C scanner sketch.
- Confirm SHT31 and MPU6050 do not share the same address.
- Keep wires short for the first breadboard test.

BLE connection problems:

- Use Chrome or Edge with Web Bluetooth support.
- Keep the browser close to the ESP32.
- Power-cycle ESP32 after repeated failed connection attempts.

JSON too long:

- This prototype keeps JSON compact.
- For longer payloads, split data into multiple notifications or negotiate a larger BLE MTU.

