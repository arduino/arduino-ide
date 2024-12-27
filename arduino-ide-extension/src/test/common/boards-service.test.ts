import type { Mutable } from '@theia/core/lib/common/types';
import { expect } from 'chai';
import {
  boardIdentifierEquals,
  boardIdentifierComparator,
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
  describe('boardIdentifierEquals', () => {
    it('should not be equal when the names equal but the FQBNs are different', () => {
      const actual = boardIdentifierEquals(
        { name: 'a', fqbn: 'a:b:c' },
        { name: 'a', fqbn: 'x:y:z' }
      );
      expect(actual).to.be.false;
    });

    it('should not be equal when the names equal but the FQBNs are different (undefined)', () => {
      const actual = boardIdentifierEquals(
        { name: 'a', fqbn: 'a:b:c' },
        { name: 'a', fqbn: undefined }
      );
      expect(actual).to.be.false;
    });

    it("should be equal when the names do not match but the FQBNs are the same (it's something IDE2 assumes to be handled by the platform or CLI)", () => {
      const actual = boardIdentifierEquals(
        { name: 'a', fqbn: 'a:b:c' },
        { name: 'b', fqbn: 'a:b:c' }
      );
      expect(actual).to.be.true;
    });

    it('should be equal when the names equal and the FQBNs are missing', () => {
      const actual = boardIdentifierEquals(
        { name: 'a', fqbn: undefined },
        { name: 'a', fqbn: undefined }
      );
      expect(actual).to.be.true;
    });

    it('should be equal when both the name and FQBN are the same, but one of the FQBN has board config options', () => {
      const actual = boardIdentifierEquals(
        { name: 'a', fqbn: 'a:b:c:menu_1=value' },
        { name: 'a', fqbn: 'a:b:c' }
      );
      expect(actual).to.be.true;
    });

    it('should not be equal when both the name and FQBN are the same, but one of the FQBN has board config options (looseFqbn: false)', () => {
      const actual = boardIdentifierEquals(
        { name: 'a', fqbn: 'a:b:c:menu_1=value' },
        { name: 'a', fqbn: 'a:b:c' },
        { looseFqbn: false }
      );
      expect(actual).to.be.false;
    });
  });

  describe('boardIdentifierComparator', () => {
    it('should sort items before falsy', () =>
      expect(
        boardIdentifierComparator({ name: 'a', fqbn: 'a:b:c' }, undefined)
      ).to.be.equal(-1));

    it("should sort 'arduino' boards before others", () =>
      expect(
        boardIdentifierComparator(
          { name: 'b', fqbn: 'arduino:b:c' },
          { name: 'a', fqbn: 'x:y:z' }
        )
      ).to.be.equal(-1));

    it("should sort 'arduino' boards before others (other is falsy)", () =>
      expect(
        boardIdentifierComparator(
          { name: 'b', fqbn: 'arduino:b:c' },
          { name: 'a', fqbn: undefined }
        )
      ).to.be.equal(-1));

    it("should sort boards by 'name' (with FQBNs)", () =>
      expect(
        boardIdentifierComparator(
          { name: 'b', fqbn: 'a:b:c' },
          { name: 'a', fqbn: 'x:y:z' }
        )
      ).to.be.equal(1));

    it("should sort boards by 'name' (no FQBNs)", () =>
      expect(
        boardIdentifierComparator(
          { name: 'b', fqbn: undefined },
          { name: 'a', fqbn: undefined }
        )
      ).to.be.equal(1));

    it("should sort boards by 'name' (one FQBN)", () =>
      expect(
        boardIdentifierComparator(
          { name: 'b', fqbn: 'a:b:c' },
          { name: 'a', fqbn: undefined }
        )
      ).to.be.equal(1));

    it("should sort boards by 'name' (both 'arduino' vendor)", () =>
      expect(
        boardIdentifierComparator(
          { name: 'b', fqbn: 'arduino:b:c' },
          { name: 'a', fqbn: 'arduino:y:z' }
        )
      ).to.be.equal(1));
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
