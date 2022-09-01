import type { Mutable } from '@theia/core/lib/common/types';
import { expect } from 'chai';
import {
  BoardInfo,
  getBoardInfo,
  noNativeSerialPort,
  nonSerialPort,
  Port,
  selectPortForInfo,
  unknownBoard,
} from '../../common/protocol';
import { createBoardList } from '../../common/protocol/board-list';
import { firstToUpperCase } from '../../common/utils';

describe('boards-service', () => {
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
      const info = await getBoardInfo(createBoardList({}));
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
          const boardList = createBoardList(
            { [Port.keyOf(selectedPort)]: { port: selectedPort } },
            { selectedPort, selectedBoard: undefined }
          );
          const info = await getBoardInfo(boardList);
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
        const boardList = createBoardList(
          {
            [Port.keyOf(port)]: { port },
          },
          { selectedPort: port, selectedBoard: undefined }
        );
        const info = await getBoardInfo(boardList);
        expect(info).to.be.equal(noNativeSerialPort);
      }
    });

    it("should detect a port as non-native serial, if protocol is 'serial' and VID/PID are available", async () => {
      const port = selectedPort({ vid, pid });
      const boardList = createBoardList(
        {
          [Port.keyOf(port)]: { port },
        },
        { selectedPort: port, selectedBoard: undefined }
      );
      const info = await getBoardInfo(boardList);
      expect(typeof info).to.be.equal('object');
      const boardInfo = <BoardInfo>info;
      expect(boardInfo.VID).to.be.equal(vid);
      expect(boardInfo.PID).to.be.equal(pid);
      expect(boardInfo.SN).to.be.equal('(null)');
      expect(boardInfo.BN).to.be.equal(unknownBoard);
    });

    it("should show the 'SN' even if no matching board was detected for the port", async () => {
      const port = selectedPort({ vid, pid, serialNumber });
      const boardList = createBoardList(
        {
          [Port.keyOf(port)]: { port },
        },
        { selectedPort: port, selectedBoard: undefined }
      );
      const info = await getBoardInfo(boardList);
      expect(typeof info).to.be.equal('object');
      const boardInfo = <BoardInfo>info;
      expect(boardInfo.VID).to.be.equal(vid);
      expect(boardInfo.PID).to.be.equal(pid);
      expect(boardInfo.SN).to.be.equal(serialNumber);
      expect(boardInfo.BN).to.be.equal(unknownBoard);
    });

    it("should use the name of the matching board as 'BN' if available", async () => {
      const port = selectedPort({ vid, pid });
      const boardList = createBoardList(
        {
          [Port.keyOf(port)]: { port, boards: [selectedBoard] },
        },
        { selectedPort: port, selectedBoard: undefined }
      );
      const info = await getBoardInfo(boardList);
      expect(typeof info).to.be.equal('object');
      const boardInfo = <BoardInfo>info;
      expect(boardInfo.VID).to.be.equal(vid);
      expect(boardInfo.PID).to.be.equal(pid);
      expect(boardInfo.SN).to.be.equal('(null)');
      expect(boardInfo.BN).to.be.equal(selectedBoard.name);
    });
  });
});
