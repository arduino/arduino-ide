import { expect } from 'chai';
import { createBoardList } from '../../common/protocol/board-list';
import {
  BoardIdentifier,
  DetectedPort,
  DetectedPorts,
  Port,
} from '../../common/protocol/boards-service';

const mkr1000: BoardIdentifier = {
  name: 'Arduino MKR1000',
  fqbn: 'arduino:samd:mkr1000',
};
const uno: BoardIdentifier = {
  name: 'Arduino Uno',
  fqbn: 'arduino:avr:uno',
};
const bluetoothSerialPort: Port = {
  address: '/dev/cu.Bluetooth-Incoming-Port',
  addressLabel: '/dev/cu.Bluetooth-Incoming-Port',
  protocol: 'serial',
  protocolLabel: 'Serial Port',
  properties: {},
  hardwareId: '',
};
const builtinSerialPort: Port = {
  address: '/dev/cu.BLTH',
  addressLabel: '/dev/cu.BLTH',
  protocol: 'serial',
  protocolLabel: 'Serial Port',
  properties: {},
  hardwareId: '',
};
const undiscoveredSerialPort: Port = {
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
const mkr1000NetworkPort: Port = {
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
const undiscoveredUsbToUARTSerialPort: Port = {
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
const mkr1000SerialPort: Port = {
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
const unoSerialPort: Port = {
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

function detectedPort(
  port: Port,
  ...boards: BoardIdentifier[]
): { [portKey: string]: DetectedPort } {
  return { [Port.keyOf(port)]: boards.length ? { port, boards } : { port } };
}

const detectedPorts: DetectedPorts = {
  ...detectedPort(builtinSerialPort),
  ...detectedPort(bluetoothSerialPort),
  ...detectedPort(unoSerialPort, uno),
  ...detectedPort(mkr1000SerialPort, mkr1000),
  ...detectedPort(mkr1000NetworkPort, mkr1000),
  ...detectedPort(undiscoveredSerialPort),
  ...detectedPort(undiscoveredUsbToUARTSerialPort),
};

describe('board-list', () => {
  describe('createBoardList', () => {
    it('should sort items deterministically', () => {
      const actual = createBoardList(detectedPorts);
      expect(actual[0].board).deep.equal(mkr1000);
      expect(actual[1].board).deep.equal(uno);
      expect(actual[2].port).deep.equal(builtinSerialPort);
      expect(actual[3].port).deep.equal(bluetoothSerialPort);
      expect(actual[4].port).deep.equal(undiscoveredUsbToUARTSerialPort);
      expect(actual[5].port).deep.equal(undiscoveredSerialPort);
      expect(actual[6].port.protocol).equal('network');
      expect(actual[6].board).deep.equal(mkr1000);
    });
  });
});
