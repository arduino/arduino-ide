import {
  BoardIdentifier,
  DetectedPort,
  DetectedPorts,
  Port,
} from '../../common/protocol/boards-service';

export const mkr1000: BoardIdentifier = {
  name: 'Arduino MKR1000',
  fqbn: 'arduino:samd:mkr1000',
};
export const uno: BoardIdentifier = {
  name: 'Arduino Uno',
  fqbn: 'arduino:avr:uno',
};
export const arduinoNanoEsp32: BoardIdentifier = {
  fqbn: 'arduino:esp32:nano_nora',
  name: 'Arduino Nano ESP32',
};
export const esp32NanoEsp32: BoardIdentifier = {
  fqbn: 'esp32:esp32:nano_nora',
  name: 'Arduino Nano ESP32',
};
export const esp32S3DevModule: BoardIdentifier = {
  name: 'ESP32S3 Dev Module',
  fqbn: 'esp32:esp32:esp32s3',
};
export const esp32S3Box: BoardIdentifier = {
  name: 'ESP32-S3-Box',
  fqbn: 'esp32:esp32:esp32s3box',
};

export const bluetoothSerialPort: Port = {
  address: '/dev/cu.Bluetooth-Incoming-Port',
  addressLabel: '/dev/cu.Bluetooth-Incoming-Port',
  protocol: 'serial',
  protocolLabel: 'Serial Port',
  properties: {},
  hardwareId: '',
};
export const builtinSerialPort: Port = {
  address: '/dev/cu.BLTH',
  addressLabel: '/dev/cu.BLTH',
  protocol: 'serial',
  protocolLabel: 'Serial Port',
  properties: {},
  hardwareId: '',
};
export const undiscoveredSerialPort: Port = {
  address: '/dev/cu.usbserial-0001',
  addressLabel: '/dev/cu.usbserial-0001',
  protocol: 'serial',
  protocolLabel: 'Serial Port (USB)',
  properties: {
    pid: '0xEA60',
    serialNumber: '0001',
    vid: '0x10C4',
  },
  hardwareId: '0001',
};
export const mkr1000NetworkPort: Port = {
  address: '192.168.0.104',
  addressLabel: 'Arduino at 192.168.0.104',
  protocol: 'network',
  protocolLabel: 'Network Port',
  properties: {
    '.': 'mkr1000',
    auth_upload: 'yes',
    board: 'mkr1000',
    hostname: 'Arduino.local.',
    port: '65280',
    ssh_upload: 'no',
    tcp_check: 'no',
  },
  hardwareId: '',
};
export const undiscoveredUsbToUARTSerialPort: Port = {
  address: '/dev/cu.SLAB_USBtoUART',
  addressLabel: '/dev/cu.SLAB_USBtoUART',
  protocol: 'serial',
  protocolLabel: 'Serial Port (USB)',
  properties: {
    pid: '0xEA60',
    serialNumber: '0001',
    vid: '0x10C4',
  },
  hardwareId: '0001',
};
export const mkr1000SerialPort: Port = {
  address: '/dev/cu.usbmodem14301',
  addressLabel: '/dev/cu.usbmodem14301',
  protocol: 'serial',
  protocolLabel: 'Serial Port (USB)',
  properties: {
    pid: '0x804E',
    serialNumber: '94A3397C5150435437202020FF150838',
    vid: '0x2341',
  },
  hardwareId: '94A3397C5150435437202020FF150838',
};
export const unoSerialPort: Port = {
  address: '/dev/cu.usbmodem14201',
  addressLabel: '/dev/cu.usbmodem14201',
  protocol: 'serial',
  protocolLabel: 'Serial Port (USB)',
  properties: {
    pid: '0x0043',
    serialNumber: '75830303934351618212',
    vid: '0x2341',
  },
  hardwareId: '75830303934351618212',
};
export const nanoEsp32SerialPort: Port = {
  address: '/dev/cu.usbmodem3485187BD9882',
  addressLabel: '/dev/cu.usbmodem3485187BD9882',
  protocol: 'serial',
  protocolLabel: 'Serial Port (USB)',
  properties: {
    pid: '0x0070',
    serialNumber: '3485187BD988',
    vid: '0x2341',
  },
  hardwareId: '3485187BD988',
};
export const nanoEsp32DetectsMultipleEsp32BoardsSerialPort: Port = {
  address: 'COM41',
  addressLabel: 'COM41',
  protocol: 'serial',
  protocolLabel: 'Serial Port (USB)',
  properties: {
    pid: '0x1001',
    serialNumber: '',
    vid: '0x303A',
  },
};

export function createPort(address: string, protocol = 'serial'): Port {
  return {
    address,
    addressLabel: `Address label: ${address}`,
    protocol,
    protocolLabel: `Protocol label: ${protocol}`,
  };
}

export function detectedPort(
  port: Port,
  ...boards: BoardIdentifier[]
): { [portKey: string]: DetectedPort } {
  return { [Port.keyOf(port)]: boards.length ? { port, boards } : { port } };
}

export function history(
  port: Port,
  board: BoardIdentifier
): { [portKey: string]: BoardIdentifier } {
  return { [Port.keyOf(port)]: board };
}

export const detectedPorts: DetectedPorts = {
  ...detectedPort(builtinSerialPort),
  ...detectedPort(bluetoothSerialPort),
  ...detectedPort(unoSerialPort, uno),
  ...detectedPort(mkr1000SerialPort, mkr1000),
  ...detectedPort(mkr1000NetworkPort, mkr1000),
  ...detectedPort(undiscoveredSerialPort),
  ...detectedPort(undiscoveredUsbToUARTSerialPort),
  // multiple discovered on the same port with different board names
  ...detectedPort(
    nanoEsp32DetectsMultipleEsp32BoardsSerialPort,
    esp32S3DevModule,
    esp32S3Box
  ),
  // multiple discovered on the same port with the same board name
  ...detectedPort(nanoEsp32SerialPort, arduinoNanoEsp32, esp32NanoEsp32),
};
