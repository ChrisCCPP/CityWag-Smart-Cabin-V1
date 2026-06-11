# Web Demo

React + Vite product concept page for CityWag Smart Cabin 0.1. It keeps the original BLE connection, mock mode, JSON parsing, and raw payload tools, but presents them in a premium partner-review interface.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Open the Vite local URL in Chrome or Edge.

## Double-Click Preview

If you double-click `index.html` directly, the page opens in offline preview mode. This mode shows the premium concept page and mock demo data, but it cannot use Web Bluetooth because the full React app must be served through Vite or another web server.

For the full React + BLE experience, use `npm run dev`.

## Mock Demo Mode

Choose `Start Demo Mode` to generate a new packet every second. Demo mode cycles through normal, warning, and danger travel conditions so the page can be shared without hardware.

## Real Hardware Connection

1. Flash the ESP32 firmware.
2. Confirm Serial Monitor prints JSON once per second.
3. Open this web demo in Chrome or Edge.
4. Choose `Connect Smart Module`.
5. Select `CityWag Smart Cabin`.

The web demo uses:

- `navigator.bluetooth.requestDevice`
- `device.gatt.connect`
- `service.getCharacteristic`
- `characteristic.startNotifications`
- `characteristicvaluechanged`

## Build

```bash
npm run build
```

## Preview Build

```bash
npm run preview
```

## GitHub Pages Deployment

This project uses `base: './'` in `vite.config.js`, which makes the built assets work from a repository subpath such as `https://username.github.io/repository-name/`.

Basic manual deployment:

1. Run `npm install`.
2. Run `npm run build`.
3. Deploy the generated `dist/` folder to GitHub Pages.

Common options:

- Use GitHub Actions to publish `dist/`.
- Use a `gh-pages` branch containing the contents of `dist/`.
- If deploying to a custom domain root and you prefer absolute asset paths, change `base` in `vite.config.js` to `/`.

## Browser Permission Notes

Web Bluetooth requires user selection and browser permission. It works best on Chrome or Edge and requires a secure context such as `localhost` or HTTPS. If the device picker is cancelled, the page shows a friendly error and keeps running.

## Common Web Bluetooth Issues

- Browser does not support Web Bluetooth: use Chrome or Edge.
- Device is not visible: confirm ESP32 is powered and advertising.
- Connection fails: restart the ESP32 and reload the page.
- JSON parse error: open Technical Payload to inspect the received packet.

## Current Scope

CityWag Smart Cabin 0.1 is a functional prototype. It does not diagnose health, control a vehicle, connect to a car system, upload to cloud services, or require login.
