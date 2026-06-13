# CityWag Smart Cabin V1 Continuity Notes

This document is for future Codex sessions and human collaborators continuing the current prototype. Keep the existing firmware and web-demo behavior intact unless a task explicitly changes the product scope.

## Current Prototype

CityWag Smart Cabin 0.1 is a product concept verification demo for CityWag / 宠漫. It demonstrates an independent smart module installed inside an in-car pet cabin, rear-seat pet bed, or pet travel crate.

The prototype reads:

- Cabin temperature and humidity through SHT31.
- Ride movement and short bumps through MPU6050.
- A simple comfort index, cabin status, pet activity status, risk reminder, and message calculated on ESP32.
- Live BLE data in a React/Vite browser dashboard.

The web demo also has Mock Mode so partners, factories, and early users can see the dashboard without hardware.

## What This Prototype Is Not

This is not a medical device. It does not diagnose pet health, detect disease, or make clinical decisions.

This is not a vehicle control system. It does not connect to a car infotainment system, read CAN bus data, control the vehicle, control windows, control air conditioning, or trigger any vehicle action.

This is not a cloud product. It does not upload data, require login, store user profiles, use a database, record audio or video, or run AI models.

## Hardware Structure

Current hardware is intentionally simple:

- ESP32 Dev Board.
- SHT31 temperature and humidity sensor module over I2C.
- MPU6050 3-axis accelerometer module over I2C.
- Dupont wires, breadboard, and USB power.

Default wiring:

| ESP32 | SHT31 | MPU6050 |
| --- | --- | --- |
| GPIO21 SDA | SDA | SDA |
| GPIO22 SCL | SCL | SCL |
| 3V3 | VCC | VCC |
| GND | GND | GND |

SHT31 and MPU6050 share the same I2C bus. Typical addresses are `0x44` for SHT31 and `0x68` for MPU6050.

## BLE Data Structure

Firmware and web demo share these BLE constants:

- Device name: `CityWag Smart Cabin`
- Service UUID: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- Characteristic UUID: `6e400003-b5a3-f393-e0a9-e50e24dcca9e`

The ESP32 notifies one compact JSON packet about once per second:

```json
{
  "temp": 24.6,
  "humidity": 52,
  "motionLevel": 0.18,
  "bumpLevel": 0.12,
  "comfortScore": 96,
  "petStatus": "calm",
  "riskLevel": "normal",
  "message": "Cabin environment looks comfortable.",
  "timestamp": 12345
}
```

Field meaning:

- `temp`: SHT31 cabin air temperature in Celsius.
- `humidity`: SHT31 relative humidity percentage.
- `motionLevel`: normalized `0.0` to `1.0` movement intensity from acceleration changes.
- `bumpLevel`: normalized `0.0` to `1.0` short bump peak inside the one-second sample cycle.
- `comfortScore`: demo score from `0` to `100`.
- `petStatus`: `calm`, `active`, `anxious`, or `unknown`.
- `riskLevel`: `normal`, `warning`, `danger`, or `unknown`.
- `message`: short non-medical reminder for the dashboard.
- `timestamp`: firmware uptime seconds or web mock timestamp.

Keep JSON compact for BLE notification reliability. If future payloads grow, split notifications or negotiate a larger MTU.

## Frontend Page Structure

The web demo lives in `web-demo/` and uses React + Vite.

Important files:

- `src/App.jsx`: main product page, BLE controls, Mock Mode controls, bilingual copy, metric cards, explanation sections, safety scope, and raw payload panel.
- `src/styles.css`: visual system and responsive layout.
- `src/bluetooth/bluetoothClient.js`: Web Bluetooth connection, notification handling, and UUID constants.
- `src/mock/mockData.js`: rotating mock packets for live demos without hardware.
- `src/utils/parseCabinData.js`: validates incoming JSON fields and converts types.
- `src/utils/formatters.js`: display formatting for temperature, humidity, score, percent, and time.
- `vite.config.js`: uses `base: './'` for GitHub Pages subpath deployment.

The page should feel like a clean product demo for partners and factories: premium, minimal, warm, black-and-white brand friendly, and focused on the actual prototype.

## Current Product Positioning

CityWag Smart Cabin 0.1 is an early demonstration module for pet mobility scenarios. It is meant to help the team discuss:

- Where a smart module might sit inside a pet travel cabin.
- Which sensors are useful in a first prototype.
- How to explain pet cabin comfort to non-technical partners.
- How factories might package the electronics and sensor opening.
- How a browser dashboard can show live data during a meeting or video demo.

The project should stay narrow until the hardware and product story are clear.

## Current Limits

- USB powered only; no battery management.
- Breadboard/prototype wiring; no enclosure or PCB yet.
- SHT31 and MPU6050 only; no air quality sensor yet.
- BLE local dashboard only; no backend or cloud.
- Web Bluetooth support depends on Chrome or Edge and a secure context such as `localhost` or HTTPS.
- Comfort and risk logic are heuristic demo rules, not certified safety thresholds.
- No login, database, camera, microphone, AI model, mobile app, or vehicle integration.

## Next Stage Roadmap

Recommended next steps:

1. Stabilize demo hardware in a small enclosure with a clear sensor opening and USB power path.
2. Add product photos or rendered installation diagrams to the web demo.
3. Improve mobile layout and consider PWA install behavior for tablet/phone demonstrations.
4. Add optional air quality sensing after the current temperature, humidity, motion, and bump loop is reliable.
5. Add local-only session logging for demo replay, if needed, without cloud upload.
6. Refine comfort scoring with more transparent thresholds and partner-friendly labels.
7. Prepare a factory handoff sheet covering BOM, wiring, enclosure notes, and test procedure.

Avoid adding backend, login, database, cloud upload, cameras, microphones, AI diagnosis, or vehicle control unless the product direction explicitly changes.

## Notes For Future Codex Work

- Do not rebuild the project from scratch. Continue from the existing `firmware/` and `web-demo/` structure.
- Preserve current BLE UUIDs and JSON field names unless firmware and web demo are updated together.
- Preserve Mock Mode because it is essential for demos without hardware.
- Keep all safety language clear: demo only, non-medical, no vehicle control, no cloud upload.
- Use small, reviewable changes. This repo is a prototype, so clarity beats clever abstraction.
- Before finishing frontend changes, run `npm run build` in `web-demo/` to protect GitHub Pages deployment.
- If adding visual assets, keep them product-relevant and lightweight.
