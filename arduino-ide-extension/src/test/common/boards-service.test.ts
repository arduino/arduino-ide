import { Deferred } from '@theia/core/lib/common/promise-util';
import { Mutable } from '@theia/core/lib/common/types';
import { expect } from 'chai';
import {
  AttachedBoardsChangeEvent,
  BoardInfo,
  getBoardInfo,
  noNativeSerialPort,
  nonSerialPort,
  Port,
  selectPortForInfo,
  unknownBoard,
} from '../../common/protocol';
import { firstToUpperCase } from '../../common/utils';

describe('boards-service', () => {
  describe('AttachedBoardsChangeEvent', () => {
    it('should detect one attached port', () => {
      const event = <AttachedBoardsChangeEvent & any>{
        oldState: {
          boards: [
            {
              name: 'Arduino MKR1000',
              fqbn: 'arduino:samd:mkr1000',
              port: '/dev/cu.usbmodem14601',
            },
            {
              name: 'Arduino Uno',
              fqbn: 'arduino:avr:uno',
              port: '/dev/cu.usbmodem14501',
            },
          ],
          ports: [
            {
              protocol: 'serial',
              address: '/dev/cu.usbmodem14501',
            },
            {
              protocol: 'serial',
              address: '/dev/cu.usbmodem14601',
            },
            {
              protocol: 'serial',
              address: '/dev/cu.Bluetooth-Incoming-Port',
            },
            { protocol: 'serial', address: '/dev/cu.MALS' },
            { protocol: 'serial', address: '/dev/cu.SOC' },
          ],
        },
        newState: {
          boards: [
            {
              name: 'Arduino MKR1000',
              fqbn: 'arduino:samd:mkr1000',
              port: '/dev/cu.usbmodem1460',
            },
            {
              name: 'Arduino Uno',
              fqbn: 'arduino:avr:uno',
              port: '/dev/cu.usbmodem14501',
            },
          ],
          ports: [
            {
              protocol: 'serial',
              address: '/dev/cu.SLAB_USBtoUART',
            },
            {
              protocol: 'serial',
              address: '/dev/cu.usbmodem14501',
            },
            {
              protocol: 'serial',
              address: '/dev/cu.usbmodem14601',
            },
            {
              protocol: 'serial',
              address: '/dev/cu.Bluetooth-Incoming-Port',
            },
            { protocol: 'serial', address: '/dev/cu.MALS' },
            { protocol: 'serial', address: '/dev/cu.SOC' },
          ],
        },
      };
      const diff = AttachedBoardsChangeEvent.diff(event);
      expect(diff.attached.boards).to.be.empty; // tslint:disable-line:no-unused-expression
      expect(diff.detached.boards).to.be.empty; // tslint:disable-line:no-unused-expression
      expect(diff.detached.ports).to.be.empty; // tslint:disable-line:no-unused-expression
      expect(diff.attached.ports.length).to.be.equal(1);
      expect(diff.attached.ports[0].address).to.be.equal(
        '/dev/cu.SLAB_USBtoUART'
      );
    });
  });

  describe('getBoardInfo', () => {
    const vid = '0x0';
    const pid = '0x1';
    const serialNumber = '1730323';
    const name = 'The Board';
    const fqbn = 'alma:korte:szolo';
    const selectedBoard = { name, fqbn };
    const selectedPort = (
      properties: Record<string, string> = {},
      protocol = 'serial'
    ): Mutable<Port> => ({
      address: 'address',
      addressLabel: 'addressLabel',
      protocol,
      protocolLabel: firstToUpperCase(protocol),
      properties,
    });

    it('should handle when no port is selected', async () => {
      const info = await getBoardInfo(undefined, never());
      expect(info).to.be.equal(selectPortForInfo);
    });

    it("should handle when port protocol is not 'serial'", async () => {
      await Promise.allSettled(
        ['network', 'teensy'].map(async (protocol) => {
          const selectedPort: Port = {
            address: 'address',
            addressLabel: 'addressLabel',
            protocolLabel: firstToUpperCase(protocol),
            protocol,
          };
          const info = await getBoardInfo(selectedPort, never());
          expect(info).to.be.equal(nonSerialPort);
        })
      );
    });

    it("should not detect a port as non-native serial, if protocol is 'serial' but VID or PID is missing", async () => {
      const insufficientProperties: Record<string, string>[] = [
        {},
        { vid },
        { pid },
        { VID: vid, pid: pid }, // case sensitive
      ];
      for (const properties of insufficientProperties) {
        const port = selectedPort(properties);
        const info = await getBoardInfo(port, {
          [Port.keyOf(port)]: [port, []],
        });
        expect(info).to.be.equal(noNativeSerialPort);
      }
    });

    it("should detect a port as non-native serial, if protocol is 'serial' and VID/PID are available", async () => {
      const port = selectedPort({ vid, pid });
      const info = await getBoardInfo(port, {
        [Port.keyOf(port)]: [port, []],
      });
      expect(typeof info).to.be.equal('object');
      const boardInfo = <BoardInfo>info;
      expect(boardInfo.VID).to.be.equal(vid);
      expect(boardInfo.PID).to.be.equal(pid);
      expect(boardInfo.SN).to.be.equal('(null)');
      expect(boardInfo.BN).to.be.equal(unknownBoard);
    });

    it("should show the 'SN' even if no matching board was detected for the port", async () => {
      const port = selectedPort({ vid, pid, serialNumber });
      const info = await getBoardInfo(port, {
        [Port.keyOf(port)]: [port, []],
      });
      expect(typeof info).to.be.equal('object');
      const boardInfo = <BoardInfo>info;
      expect(boardInfo.VID).to.be.equal(vid);
      expect(boardInfo.PID).to.be.equal(pid);
      expect(boardInfo.SN).to.be.equal(serialNumber);
      expect(boardInfo.BN).to.be.equal(unknownBoard);
    });

    it("should use the name of the matching board as 'BN' if available", async () => {
      const port = selectedPort({ vid, pid });
      const info = await getBoardInfo(port, {
        [Port.keyOf(port)]: [port, [selectedBoard]],
      });
      expect(typeof info).to.be.equal('object');
      const boardInfo = <BoardInfo>info;
      expect(boardInfo.VID).to.be.equal(vid);
      expect(boardInfo.PID).to.be.equal(pid);
      expect(boardInfo.SN).to.be.equal('(null)');
      expect(boardInfo.BN).to.be.equal(selectedBoard.name);
    });
  });
});

function never<T>(): Promise<T> {
  return new Deferred<T>().promise;
}
