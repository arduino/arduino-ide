import { expect } from 'chai';
import { Unknown } from '../../common/nls';
import {
  BoardListLabels,
  createBoardList,
  EditBoardsConfigActionParams,
  isInferredBoardListItem,
  isMultiBoardsBoardListItem,
  SelectBoardsConfigActionParams,
} from '../../common/protocol/board-list';
import {
  emptyBoardsConfig,
  notConnected,
  selectBoard,
  unconfirmedBoard,
} from '../../common/protocol/boards-service';
import {
  arduinoNanoEsp32,
  bluetoothSerialPort,
  builtinSerialPort,
  createPort,
  detectedPort,
  detectedPorts,
  esp32NanoEsp32,
  esp32S3Box,
  esp32S3DevModule,
  history,
  mkr1000,
  mkr1000NetworkPort,
  mkr1000SerialPort,
  nanoEsp32DetectsMultipleEsp32BoardsSerialPort,
  nanoEsp32SerialPort,
  undiscoveredSerialPort,
  undiscoveredUsbToUARTSerialPort,
  uno,
  unoSerialPort,
} from './fixtures';

describe('board-list', () => {
  describe('boardList#labels', () => {
    it('should handle no selected board+port', () => {
      const { labels } = createBoardList({});
      const expected: BoardListLabels = {
        boardLabel: selectBoard,
        portProtocol: undefined,
        selected: false,
        tooltip: selectBoard,
      };
      expect(labels).to.be.deep.equal(expected);
    });

    it('should handle port selected (port detected)', () => {
      const { labels } = createBoardList(
        {
          ...detectedPort(unoSerialPort, uno),
        },
        { selectedBoard: undefined, selectedPort: unoSerialPort }
      );
      const expected: BoardListLabels = {
        boardLabel: selectBoard,
        portProtocol: undefined,
        selected: false,
        tooltip: unoSerialPort.address,
      };
      expect(labels).to.be.deep.equal(expected);
    });

    it('should handle port selected (port not detected)', () => {
      const { labels } = createBoardList(
        {
          ...detectedPort(mkr1000SerialPort, mkr1000),
        },
        { selectedBoard: undefined, selectedPort: unoSerialPort }
      );
      const expected: BoardListLabels = {
        boardLabel: selectBoard,
        portProtocol: undefined,
        selected: false,
        tooltip: `${unoSerialPort.address} ${notConnected}`,
      };
      expect(labels).to.be.deep.equal(expected);
    });

    it('should handle board selected (with FQBN)', () => {
      const { labels } = createBoardList(
        {},
        { selectedBoard: uno, selectedPort: undefined }
      );
      const expected: BoardListLabels = {
        boardLabel: uno.name,
        portProtocol: undefined,
        selected: false,
        tooltip: `${uno.name} (${uno.fqbn})`,
      };
      expect(labels).to.be.deep.equal(expected);
    });

    it('should handle board selected (no FQBN)', () => {
      const { labels } = createBoardList(
        {},
        {
          selectedBoard: { name: 'my board', fqbn: undefined },
          selectedPort: undefined,
        }
      );
      const expected: BoardListLabels = {
        boardLabel: 'my board',
        portProtocol: undefined,
        selected: false,
        tooltip: 'my board',
      };
      expect(labels).to.be.deep.equal(expected);
    });

    it('should handle both selected (port not detected)', () => {
      const { labels } = createBoardList(
        {
          ...detectedPort(mkr1000SerialPort, mkr1000),
        },
        { selectedBoard: mkr1000, selectedPort: unoSerialPort }
      );
      const expected: BoardListLabels = {
        boardLabel: mkr1000.name,
        portProtocol: 'serial',
        selected: false,
        tooltip: `${mkr1000.name} (${mkr1000.fqbn})\n${unoSerialPort.address} ${notConnected}`,
      };
      expect(labels).to.be.deep.equal(expected);
    });

    it('should handle both selected (board not discovered)', () => {
      const { labels } = createBoardList(
        {
          ...detectedPort(unoSerialPort, uno),
        },
        { selectedBoard: mkr1000, selectedPort: unoSerialPort }
      );
      const expected: BoardListLabels = {
        boardLabel: mkr1000.name,
        portProtocol: 'serial',
        selected: false,
        tooltip: `${mkr1000.name} (${mkr1000.fqbn})\n${unoSerialPort.address}`,
      };
      expect(labels).to.be.deep.equal(expected);
    });

    it('should handle both selected (no FQBN)', () => {
      const { labels } = createBoardList(
        {
          ...detectedPort(unoSerialPort, { name: 'my board', fqbn: undefined }),
        },
        {
          selectedBoard: { name: 'my board', fqbn: undefined },
          selectedPort: unoSerialPort,
        }
      );
      const expected: BoardListLabels = {
        boardLabel: 'my board',
        portProtocol: 'serial',
        selected: true,
        tooltip: `my board\n${unoSerialPort.address}`,
      };
      expect(labels).to.be.deep.equal(expected);
    });

    it('should handle both selected', () => {
      const { labels } = createBoardList(
        {
          ...detectedPort(mkr1000NetworkPort, mkr1000),
        },
        { selectedBoard: mkr1000, selectedPort: mkr1000NetworkPort }
      );
      const expected: BoardListLabels = {
        boardLabel: mkr1000.name,
        portProtocol: 'network',
        selected: true,
        tooltip: `${mkr1000.name} (${mkr1000.fqbn})\n${mkr1000NetworkPort.address}`,
      };
      expect(labels).to.be.deep.equal(expected);
    });
  });

  describe('createBoardList', () => {
    it('should sort the items deterministically', () => {
      const { items } = createBoardList(detectedPorts);

      expect(items.length).to.be.equal(Object.keys(detectedPorts).length);
      expect(items[0].board).deep.equal(mkr1000);
      expect(items[1].board).deep.equal(uno);
      expect(items[2].board).is.undefined;
      expect(isMultiBoardsBoardListItem(items[2])).to.be.true;
      const boards2 = isMultiBoardsBoardListItem(items[2])
        ? items[2].boards
        : undefined;
      expect(boards2).deep.equal([arduinoNanoEsp32, esp32NanoEsp32]);
      expect(items[3].board).is.undefined;
      expect(isMultiBoardsBoardListItem(items[3])).to.be.true;
      const boards3 = isMultiBoardsBoardListItem(items[3])
        ? items[3].boards
        : undefined;
      expect(boards3).deep.equal([esp32S3Box, esp32S3DevModule]);
      expect(items[4].port).deep.equal(builtinSerialPort);
      expect(items[5].port).deep.equal(bluetoothSerialPort);
      expect(items[6].port).deep.equal(undiscoveredSerialPort);
      expect(items[7].port).deep.equal(undiscoveredUsbToUARTSerialPort);
      expect(items[8].port.protocol).equal('network');
      expect(items[8].board).deep.equal(mkr1000);
    });

    it('should sort Arduino items before others', () => {
      const detectedPorts = {
        ...detectedPort(createPort('a'), { name: 'aa', fqbn: 'arduino:a:a' }),
        ...detectedPort(createPort('b'), { name: 'ab', fqbn: 'other:a:b' }),
        ...detectedPort(createPort('c'), { name: 'ac', fqbn: 'arduino:a:c' }),
      };
      const { items } = createBoardList(detectedPorts);

      expect(items.length).to.be.equal(3);
      expect(items[0].board?.name).to.be.equal('aa');
      expect(items[1].board?.name).to.be.equal('ac');
      expect(items[2].board?.name).to.be.equal('ab');
    });

    it('should sort items by inferred board if any', () => {
      const portA = createPort('portA');
      const portB = createPort('portB');
      const detectedPorts = {
        ...detectedPort(portA),
        ...detectedPort(portB),
      };
      const boardListHistory = {
        ...history(portA, { name: 'bbb', fqbn: undefined }),
        ...history(portB, { name: 'aaa', fqbn: undefined }),
      };
      const { items } = createBoardList(
        detectedPorts,
        emptyBoardsConfig(),
        boardListHistory
      );

      expect(items.length).to.be.equal(2);
      expect(items[0].port.address).to.be.equal('portB');
      expect(items[0].board).to.be.undefined;
      const inferredBoardA = isInferredBoardListItem(items[0])
        ? items[0].inferredBoard
        : undefined;
      expect(inferredBoardA).to.be.not.undefined;
      expect(inferredBoardA?.name).to.be.equal('aaa');

      expect(items[1].port.address).to.be.equal('portA');
      expect(items[1].board).to.be.undefined;
      expect(isInferredBoardListItem(items[1])).to.be.true;
      const inferredBoardB = isInferredBoardListItem(items[1])
        ? items[1].inferredBoard
        : undefined;
      expect(inferredBoardB).to.be.not.undefined;
      expect(inferredBoardB?.name).to.be.equal('bbb');
    });

    it('should sort ambiguous boards with unique board name before other ambiguous boards', () => {
      const portA = createPort('portA');
      const portB = createPort('portB');
      const unique_ArduinoZZZ = { fqbn: 'arduino:e:f', name: 'zzz' };
      const unique_OtherZZZ = { fqbn: 'a:b:c', name: 'zzz' };
      const nonUnique_AAA = { fqbn: 'g:h:i', name: 'aaa' };
      const nonUnique_BBB = { fqbn: 'j:k:l', name: 'bbb' };
      const detectedPorts = {
        ...detectedPort(portA, nonUnique_AAA, nonUnique_BBB),
        ...detectedPort(portB, unique_OtherZZZ, unique_ArduinoZZZ),
      };
      const { items } = createBoardList(detectedPorts);

      expect(items.length).to.be.equal(2);
      expect(isMultiBoardsBoardListItem(items[0])).to.be.true;
      const ambiguousBoardWithUniqueName = isMultiBoardsBoardListItem(items[0])
        ? items[0]
        : undefined;
      expect(ambiguousBoardWithUniqueName).to.be.not.undefined;
      expect(ambiguousBoardWithUniqueName?.labels.boardLabel).to.be.equal(
        unique_ArduinoZZZ.name
      );
      expect(ambiguousBoardWithUniqueName?.port).to.be.deep.equal(portB);
      expect(ambiguousBoardWithUniqueName?.boards).to.be.deep.equal([
        unique_ArduinoZZZ,
        unique_OtherZZZ,
      ]);

      expect(isMultiBoardsBoardListItem(items[1])).to.be.true;
      const ambiguousBoardWithoutName = isMultiBoardsBoardListItem(items[1])
        ? items[1]
        : undefined;
      expect(ambiguousBoardWithoutName).to.be.not.undefined;
      expect(ambiguousBoardWithoutName?.labels.boardLabel).to.be.equal(
        unconfirmedBoard
      );
      expect(ambiguousBoardWithoutName?.port).to.be.deep.equal(portA);
      expect(ambiguousBoardWithoutName?.boards).to.be.deep.equal([
        nonUnique_AAA,
        nonUnique_BBB,
      ]);
    });

    it('should detect when a discovered board is overridden by a historical selection', () => {
      const otherBoard = { name: 'other', fqbn: 'a:b:c' };
      const detectedPorts = {
        ...detectedPort(unoSerialPort, uno),
      };
      const boardListHistory = {
        ...history(unoSerialPort, otherBoard),
      };
      const { items } = createBoardList(
        detectedPorts,
        emptyBoardsConfig(),
        boardListHistory
      );

      expect(items.length).to.be.equal(1);
      const inferredBoard = isInferredBoardListItem(items[0])
        ? items[0]
        : undefined;
      expect(inferredBoard).is.not.undefined;
      expect(inferredBoard?.inferredBoard).to.be.deep.equal(otherBoard);
      expect(inferredBoard?.board).to.be.deep.equal(uno);
    });

    it(`should use the '${Unknown}' as the board label when no boards were discovered on a detected port`, () => {
      const { items } = createBoardList({ ...detectedPort(unoSerialPort) });
      expect(items[0].labels.boardLabel).to.be.equal(Unknown);
    });

    describe('boards', () => {
      it('should include discovered boards on detected ports', () => {
        const { boards } = createBoardList({
          ...detectedPort(unoSerialPort, uno),
          ...detectedPort(mkr1000SerialPort, mkr1000),
          ...detectedPort(undiscoveredSerialPort),
        });
        expect(boards).to.deep.equal([
          {
            port: mkr1000SerialPort,
            board: mkr1000,
          },
          {
            port: unoSerialPort,
            board: uno,
          },
        ]);
      });

      it('should include manually selected boards on detected ports', () => {
        const { boards } = createBoardList({
          ...detectedPort(unoSerialPort, uno),
          ...detectedPort(undiscoveredSerialPort, uno),
          ...detectedPort(undiscoveredUsbToUARTSerialPort),
        });
        expect(boards).to.deep.equal([
          {
            port: unoSerialPort,
            board: uno,
          },
          {
            port: undiscoveredSerialPort,
            board: uno,
          },
        ]);
      });

      it('should include manually overridden boards on detected ports', () => {
        const { boards } = createBoardList(
          {
            ...detectedPort(unoSerialPort, uno),
            ...detectedPort(mkr1000SerialPort, mkr1000),
          },
          emptyBoardsConfig(),
          {
            ...history(unoSerialPort, mkr1000),
          }
        );
        expect(boards).to.deep.equal([
          {
            port: mkr1000SerialPort,
            board: mkr1000,
          },
          {
            port: unoSerialPort,
            board: mkr1000,
          },
        ]);
      });

      it('should include all boards discovered on a port', () => {
        const { boards } = createBoardList({
          ...detectedPort(
            nanoEsp32SerialPort,
            arduinoNanoEsp32,
            esp32NanoEsp32
          ),
          ...detectedPort(
            nanoEsp32DetectsMultipleEsp32BoardsSerialPort,
            esp32S3DevModule,
            esp32S3Box
          ),
        });
        expect(boards).to.deep.equal([
          {
            port: nanoEsp32SerialPort,
            board: arduinoNanoEsp32,
          },
          {
            port: nanoEsp32SerialPort,
            board: esp32NanoEsp32,
          },
          {
            port: nanoEsp32DetectsMultipleEsp32BoardsSerialPort,
            board: esp32S3Box,
          },
          {
            port: nanoEsp32DetectsMultipleEsp32BoardsSerialPort,
            board: esp32S3DevModule,
          },
        ]);
      });

      it('should include all boards discovered on a port (handle manual select)', () => {
        const { boards } = createBoardList(
          {
            ...detectedPort(
              nanoEsp32SerialPort,
              arduinoNanoEsp32,
              esp32NanoEsp32
            ),
          },
          emptyBoardsConfig(),
          {
            ...history(nanoEsp32SerialPort, esp32S3DevModule),
          }
        );
        expect(boards).to.deep.equal([
          {
            port: nanoEsp32SerialPort,
            board: arduinoNanoEsp32,
          },
          {
            port: nanoEsp32SerialPort,
            board: esp32NanoEsp32,
          },
          {
            port: nanoEsp32SerialPort,
            board: esp32S3DevModule,
          },
        ]);
      });
    });

    describe('defaultAction', () => {
      it("'select' should be the default action for identifier boards", () => {
        const { items } = createBoardList({
          ...detectedPort(mkr1000SerialPort, mkr1000),
        });
        const item = items[0];
        expect(item.defaultAction.type).to.be.equal('select-boards-config');
        expect(item.defaultAction.params).to.be.deep.equal({
          selectedPort: mkr1000SerialPort,
          selectedBoard: mkr1000,
        });
      });

      it("'select' should be the default action for manually selected items (no discovered boards)", () => {
        const { items } = createBoardList(
          {
            ...detectedPort(undiscoveredSerialPort),
          },
          emptyBoardsConfig(),
          {
            ...history(undiscoveredSerialPort, uno),
          }
        );
        const item = items[0];
        expect(item.defaultAction.type).to.be.equal('select-boards-config');
        expect(item.defaultAction.params).to.be.deep.equal({
          selectedPort: undiscoveredSerialPort,
          selectedBoard: uno,
        });
      });

      it("'select' should be the default action for manually selected items (ambiguous boards)", () => {
        const { items } = createBoardList(
          {
            ...detectedPort(
              nanoEsp32SerialPort,
              arduinoNanoEsp32,
              esp32NanoEsp32
            ),
          },
          emptyBoardsConfig(),
          {
            ...history(nanoEsp32SerialPort, mkr1000),
          }
        );
        const item = items[0];
        expect(item.defaultAction.type).to.be.equal('select-boards-config');
        expect(item.defaultAction.params).to.be.deep.equal({
          selectedBoard: mkr1000,
          selectedPort: nanoEsp32SerialPort,
        });
      });

      it("'edit' should be the default action for ports with no boards", () => {
        const { items } = createBoardList({
          ...detectedPort(undiscoveredSerialPort),
        });
        const item = items[0];
        expect(item).to.be.not.undefined;
        expect(item.defaultAction.type).to.be.equal('edit-boards-config');
        const params = <EditBoardsConfigActionParams>item.defaultAction.params;
        const expectedParams: EditBoardsConfigActionParams = {
          query: '',
          portToSelect: undiscoveredSerialPort,
        };
        expect(params).to.be.deep.equal(expectedParams);
      });

      it("'edit' should be the default action for ports with multiple boards (unique board name)", () => {
        const { items } = createBoardList({
          ...detectedPort(
            nanoEsp32SerialPort,
            arduinoNanoEsp32,
            esp32NanoEsp32
          ),
        });
        const item = items[0];
        expect(item).to.be.not.undefined;
        expect(item.defaultAction.type).to.be.equal('edit-boards-config');
        const params = <EditBoardsConfigActionParams>item.defaultAction.params;
        const expectedParams: EditBoardsConfigActionParams = {
          query: arduinoNanoEsp32.name,
          portToSelect: nanoEsp32SerialPort,
          searchSet: [arduinoNanoEsp32, esp32NanoEsp32],
        };
        expect(params).to.be.deep.equal(expectedParams);
      });

      it("'edit' should be the default action for ports with multiple boards (no unique board name)", () => {
        const { items } = createBoardList({
          ...detectedPort(
            nanoEsp32DetectsMultipleEsp32BoardsSerialPort,
            esp32S3DevModule,
            esp32S3Box
          ),
        });
        const item = items[0];
        expect(item).to.be.not.undefined;
        expect(item.defaultAction.type).to.be.equal('edit-boards-config');
        const params = <EditBoardsConfigActionParams>item.defaultAction.params;
        const expectedParams: EditBoardsConfigActionParams = {
          query: '',
          portToSelect: nanoEsp32DetectsMultipleEsp32BoardsSerialPort,
          searchSet: [esp32S3Box, esp32S3DevModule],
        };
        expect(params).to.be.deep.equal(expectedParams);
      });
    });

    describe('otherActions', () => {
      it('should provide no other actions for identified board', () => {
        const { items } = createBoardList({
          ...detectedPort(mkr1000SerialPort, mkr1000),
        });
        const item = items[0];
        expect(item.otherActions).to.be.empty;
      });

      it('should provide no other actions for identified board (when historical revision is self)', () => {
        const { items } = createBoardList(
          {
            ...detectedPort(mkr1000SerialPort, mkr1000),
          },
          emptyBoardsConfig(),
          {
            ...history(mkr1000SerialPort, mkr1000),
          }
        );
        const item = items[0];
        expect(item.otherActions).to.be.empty;
      });

      it('should provide no other actions for unknown boards', () => {
        const { items } = createBoardList({
          ...detectedPort(undiscoveredSerialPort),
        });
        const item = items[0];
        expect(item.otherActions).to.be.empty;
      });

      it('should provide no other actions for ambiguous boards', () => {
        const { items } = createBoardList({
          ...detectedPort(
            nanoEsp32SerialPort,
            arduinoNanoEsp32,
            esp32NanoEsp32
          ),
        });
        const item = items[0];
        expect(item.otherActions).to.be.empty;
      });

      it("should provide 'edit' action for unidentified items with manually selected board", () => {
        const { items } = createBoardList(
          {
            ...detectedPort(undiscoveredSerialPort),
          },
          emptyBoardsConfig(),
          {
            ...history(undiscoveredSerialPort, uno),
          }
        );
        const item = items[0];
        const expectedParams: EditBoardsConfigActionParams = {
          query: uno.name,
          portToSelect: undiscoveredSerialPort,
        };
        expect(item.otherActions).to.be.deep.equal({
          edit: {
            params: expectedParams,
            type: 'edit-boards-config',
          },
        });
      });

      it("should provide 'edit' action for ambiguous items with manually selected board (unique board name)", () => {
        const { items } = createBoardList(
          {
            ...detectedPort(
              nanoEsp32SerialPort,
              esp32NanoEsp32,
              arduinoNanoEsp32
            ),
          },
          emptyBoardsConfig(),
          {
            ...history(nanoEsp32SerialPort, arduinoNanoEsp32),
          }
        );
        const item = items[0];
        const expectedParams: EditBoardsConfigActionParams = {
          query: arduinoNanoEsp32.name,
          portToSelect: nanoEsp32SerialPort,
          searchSet: [arduinoNanoEsp32, esp32NanoEsp32],
        };
        expect(item.otherActions).to.be.deep.equal({
          edit: {
            params: expectedParams,
            type: 'edit-boards-config',
          },
        });
      });

      it("should provide 'edit' action for ambiguous items with manually selected board (no unique board name)", () => {
        const { items } = createBoardList(
          {
            ...detectedPort(
              nanoEsp32DetectsMultipleEsp32BoardsSerialPort,
              esp32S3Box,
              esp32S3DevModule
            ),
          },
          emptyBoardsConfig(),
          {
            ...history(nanoEsp32DetectsMultipleEsp32BoardsSerialPort, uno),
          }
        );
        const item = items[0];
        const expectedParams: EditBoardsConfigActionParams = {
          query: '',
          portToSelect: nanoEsp32DetectsMultipleEsp32BoardsSerialPort,
          searchSet: [esp32S3Box, esp32S3DevModule],
        };
        expect(item.otherActions).to.be.deep.equal({
          edit: {
            params: expectedParams,
            type: 'edit-boards-config',
          },
        });
      });

      it("should provide 'edit' and 'revert' actions for identified items with a manually overridden board", () => {
        const { items } = createBoardList(
          {
            ...detectedPort(mkr1000SerialPort, mkr1000),
          },
          emptyBoardsConfig(),
          {
            ...history(mkr1000SerialPort, uno),
          }
        );
        const item = items[0];
        const expectedEditParams: EditBoardsConfigActionParams = {
          query: uno.name,
          portToSelect: mkr1000SerialPort,
        };
        const expectedRevertParams: SelectBoardsConfigActionParams = {
          selectedBoard: mkr1000,
          selectedPort: item.port,
        };
        expect(item.otherActions).to.be.deep.equal({
          edit: {
            params: expectedEditParams,
            type: 'edit-boards-config',
          },
          revert: {
            params: expectedRevertParams,
            type: 'select-boards-config',
          },
        });
      });
    });
  });
});
