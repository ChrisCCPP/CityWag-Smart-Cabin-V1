export const DEVICE_NAME = 'CityWag Smart Cabin';
export const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

const textDecoder = new TextDecoder('utf-8');

export function isWebBluetoothSupported() {
  return Boolean(navigator.bluetooth);
}

export async function connectCabinDevice({ onData, onDisconnected }) {
  if (!isWebBluetoothSupported()) {
    throw new Error('This browser does not support Web Bluetooth. Try Chrome or Edge.');
  }

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ name: DEVICE_NAME }],
    optionalServices: [SERVICE_UUID],
  });

  device.addEventListener('gattserverdisconnected', () => {
    onDisconnected?.();
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(SERVICE_UUID);
  const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

  const handleValueChanged = (event) => {
    const raw = textDecoder.decode(event.target.value);
    onData?.(raw);
  };

  characteristic.addEventListener('characteristicvaluechanged', handleValueChanged);
  await characteristic.startNotifications();

  return {
    device,
    characteristic,
    disconnect() {
      characteristic.removeEventListener('characteristicvaluechanged', handleValueChanged);
      if (device.gatt.connected) {
        device.gatt.disconnect();
      }
    },
  };
}

