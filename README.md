# CityWag Smart Cabin 0.1

CityWag Smart Cabin 0.1 is an early functional prototype for an external smart module used with an in-car pet cabin, rear-seat pet bed, or travel crate. It reads the small cabin environment and ride movement, then streams a compact status packet to a browser dashboard over BLE.

This is a prototype for demos, videos, and user testing. It is not a medical device, does not control a vehicle, does not connect to a car infotainment system, and does not upload data to the cloud.

## Prototype Goal

The goal is to make the first usable proof of concept for the CityWag / 宠漫 brand:

- ESP32 reads SHT31 temperature and humidity data.
- ESP32 reads MPU6050 acceleration data.
- Firmware calculates `motionLevel`, `bumpLevel`, `comfortScore`, `petStatus`, `riskLevel`, and `message`.
- ESP32 exposes a BLE GATT service and notifies JSON once per second.
- React + Vite web demo connects with Web Bluetooth API and renders a live dashboard.
- Mock mode lets the dashboard run without hardware.

## Project Structure

```text
citywag-smart-cabin/
├── README.md
├── firmware/
│   ├── platformio.ini
│   ├── src/
│   │   └── main.cpp
│   └── README.md
└── web-demo/
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── styles.css
    │   ├── bluetooth/
    │   │   └── bluetoothClient.js
    │   ├── mock/
    │   │   └── mockData.js
    │   └── utils/
    │       ├── parseCabinData.js
    │       └── formatters.js
    └── README.md
```

## Hardware

- ESP32 Dev Board
- SHT31 temperature and humidity sensor module, I2C
- MPU6050 3-axis accelerometer module, I2C
- Dupont wires
- Breadboard
- USB power

Default I2C wiring:

| ESP32 | SHT31 | MPU6050 |
| --- | --- | --- |
| GPIO21 SDA | SDA | SDA |
| GPIO22 SCL | SCL | SCL |
| 3V3 | VCC | VCC |
| GND | GND | GND |

SHT31 and MPU6050 share the same I2C bus. Typical addresses are `0x44` for SHT31 and `0x68` for MPU6050.

## Data Flow

```text
SHT31 + MPU6050
-> ESP32 reads I2C sensor data
-> ESP32 calculates comfort and travel state
-> ESP32 notifies compact JSON over BLE every 1 second
-> Browser connects through Web Bluetooth API
-> React dashboard displays status, risk, and reminders
```

BLE constants are shared by firmware and web demo:

- Device name: `CityWag Smart Cabin`
- Service UUID: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- Characteristic UUID: `6e400003-b5a3-f393-e0a9-e50e24dcca9e`

## Quick Start

Run the web demo in mock mode:

```bash
cd web-demo
npm install
npm run dev
```

Open the local Vite URL in Chrome or Edge, then choose `Start Mock Mode`.

Flash the ESP32 firmware:

```bash
cd firmware
pio run --target upload
pio device monitor
```

Connect real hardware:

1. Wire SHT31 and MPU6050 to the ESP32 I2C pins.
2. Flash the firmware.
3. Confirm JSON prints in Serial Monitor at `115200`.
4. Open the web demo in Chrome or Edge.
5. Click `Connect Device` and select `CityWag Smart Cabin`.

## Browser Requirements

Use Chrome or Edge on a desktop or Android device that supports the Web Bluetooth API. Web Bluetooth is not broadly available in Safari, and permissions require a secure context such as `localhost` or HTTPS.

## Current Version Limits

- Not a medical device.
- Does not diagnose pet health.
- Does not control the vehicle.
- Does not connect to a car infotainment system.
- Does not upload data to the cloud.
- Does not include login, database, camera, microphone, or AI model features.
- Uses USB power and does not include battery management.
- Built as a functional prototype only.

## Next Development Directions

- Add air quality sensing.
- Add local data logging.
- Add optional fan module control.
- Add mobile-friendly PWA behavior.
- Explore future smart seat or cabin display concepts.

