import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  LocalStorageService,
  StorageService,
} from '@theia/core/lib/browser/storage-service';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { MessageService } from '@theia/core/lib/common/message-service';
import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { BoardsDataStore } from '../../browser/boards/boards-data-store';
import { BoardsServiceProvider } from '../../browser/boards/boards-service-provider';
import { NotificationCenter } from '../../browser/notification-center';
import {
  BoardIdentifierChangeEvent,
  BoardsConfig,
  BoardsConfigChangeEvent,
  BoardsService,
  DetectedPorts,
  Port,
  PortIdentifierChangeEvent,
} from '../../common/protocol/boards-service';
import { NotificationServiceServer } from '../../common/protocol/notification-service';
import {
  detectedPort,
  esp32S3DevModule,
  mkr1000,
  mkr1000SerialPort,
  undiscoveredSerialPort,
  uno,
  unoSerialPort,
} from '../common/fixtures';
import { bindBrowser } from './browser-test-bindings';

disableJSDOM();

describe('board-service-provider', () => {
  let toDisposeAfterEach: DisposableCollection;
  let boardsServiceProvider: BoardsServiceProvider;
  let notificationCenter: NotificationCenter;

  beforeEach(async () => {
    const container = createContainer();
    container.get<FrontendApplicationStateService>(
      FrontendApplicationStateService
    ).state = 'ready';
    boardsServiceProvider = container.get<BoardsServiceProvider>(
      BoardsServiceProvider
    );
    notificationCenter = container.get<NotificationCenter>(NotificationCenter);
    toDisposeAfterEach = new DisposableCollection(
      Disposable.create(() => boardsServiceProvider.onStop())
    );
    boardsServiceProvider.onStart();
    await boardsServiceProvider.ready;
  });

  afterEach(() => {
    toDisposeAfterEach.dispose();
  });

  it('should update the port (port identifier)', () => {
    boardsServiceProvider['_boardsConfig'] = {
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    };
    const events: BoardsConfigChangeEvent[] = [];
    toDisposeAfterEach.push(
      boardsServiceProvider.onBoardsConfigDidChange((event) =>
        events.push(event)
      )
    );
    const didUpdate = boardsServiceProvider.updateConfig(mkr1000SerialPort);
    expect(didUpdate).to.be.true;
    const expectedEvent: PortIdentifierChangeEvent = {
      previousSelectedPort: unoSerialPort,
      selectedPort: mkr1000SerialPort,
    };
    expect(events).deep.equals([expectedEvent]);
  });

  it('should update the port (boards config)', () => {
    boardsServiceProvider['_boardsConfig'] = {
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    };
    const events: BoardsConfigChangeEvent[] = [];
    toDisposeAfterEach.push(
      boardsServiceProvider.onBoardsConfigDidChange((event) =>
        events.push(event)
      )
    );
    const didUpdate = boardsServiceProvider.updateConfig({
      selectedPort: mkr1000SerialPort,
      selectedBoard: uno,
    });
    expect(didUpdate).to.be.true;
    const expectedEvent: PortIdentifierChangeEvent = {
      previousSelectedPort: unoSerialPort,
      selectedPort: mkr1000SerialPort,
    };
    expect(events).deep.equals([expectedEvent]);
  });

  it('should not update the port if did not change (port identifier)', () => {
    boardsServiceProvider['_boardsConfig'] = {
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    };
    const events: BoardsConfigChangeEvent[] = [];
    toDisposeAfterEach.push(
      boardsServiceProvider.onBoardsConfigDidChange((event) =>
        events.push(event)
      )
    );
    const didUpdate = boardsServiceProvider.updateConfig(unoSerialPort);
    expect(didUpdate).to.be.false;
    expect(events).to.be.empty;
  });

  it('should update the board (board identifier)', () => {
    boardsServiceProvider['_boardsConfig'] = {
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    };
    const events: BoardsConfigChangeEvent[] = [];
    toDisposeAfterEach.push(
      boardsServiceProvider.onBoardsConfigDidChange((event) =>
        events.push(event)
      )
    );
    const didUpdate = boardsServiceProvider.updateConfig(mkr1000);
    expect(didUpdate).to.be.true;
    const expectedEvent: BoardIdentifierChangeEvent = {
      previousSelectedBoard: uno,
      selectedBoard: mkr1000,
    };
    expect(events).deep.equals([expectedEvent]);
  });

  it('should update the board (boards config)', () => {
    boardsServiceProvider['_boardsConfig'] = {
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    };
    const events: BoardsConfigChangeEvent[] = [];
    toDisposeAfterEach.push(
      boardsServiceProvider.onBoardsConfigDidChange((event) =>
        events.push(event)
      )
    );
    const didUpdate = boardsServiceProvider.updateConfig({
      selectedBoard: mkr1000,
      selectedPort: unoSerialPort,
    });
    expect(didUpdate).to.be.true;
    const expectedEvent: BoardIdentifierChangeEvent = {
      previousSelectedBoard: uno,
      selectedBoard: mkr1000,
    };
    expect(events).deep.equals([expectedEvent]);
  });

  it('should not update the board if did not change (board identifier)', () => {
    boardsServiceProvider['_boardsConfig'] = {
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    };
    const events: BoardsConfigChangeEvent[] = [];
    toDisposeAfterEach.push(
      boardsServiceProvider.onBoardsConfigDidChange((event) =>
        events.push(event)
      )
    );
    const didUpdate = boardsServiceProvider.updateConfig(uno);
    expect(didUpdate).to.be.false;
    expect(events).to.be.empty;
  });

  it('should update both the board and port', () => {
    boardsServiceProvider['_boardsConfig'] = {
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    };
    const events: BoardsConfigChangeEvent[] = [];
    toDisposeAfterEach.push(
      boardsServiceProvider.onBoardsConfigDidChange((event) =>
        events.push(event)
      )
    );
    const didUpdate = boardsServiceProvider.updateConfig({
      selectedBoard: mkr1000,
      selectedPort: mkr1000SerialPort,
    });
    expect(didUpdate).to.be.true;
    const expectedEvent: BoardIdentifierChangeEvent &
      PortIdentifierChangeEvent = {
      previousSelectedBoard: uno,
      selectedBoard: mkr1000,
      previousSelectedPort: unoSerialPort,
      selectedPort: mkr1000SerialPort,
    };
    expect(events).deep.equals([expectedEvent]);
  });

  it('should update neither the board nor the port if did not change', () => {
    boardsServiceProvider['_boardsConfig'] = {
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    };
    const events: BoardsConfigChangeEvent[] = [];
    toDisposeAfterEach.push(
      boardsServiceProvider.onBoardsConfigDidChange((event) =>
        events.push(event)
      )
    );
    const didUpdate = boardsServiceProvider.updateConfig({
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    });
    expect(didUpdate).to.be.false;
    expect(events).to.be.empty;
  });

  it('should detect a port change and find selection index', () => {
    let boardList = boardsServiceProvider.boardList;
    const didUpdate = boardsServiceProvider.updateConfig({
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    });
    expect(didUpdate).to.be.true;
    expect(boardList.selectedIndex).to.be.equal(-1);
    let selectedItem = boardList.items[boardList.selectedIndex];
    expect(selectedItem).to.be.undefined;

    // attach board
    notificationCenter.notifyDetectedPortsDidChange({
      detectedPorts: {
        ...detectedPort(unoSerialPort, uno),
      },
    });
    boardList = boardsServiceProvider.boardList;
    expect(boardsServiceProvider.boardList.selectedIndex).to.be.equal(0);
    selectedItem = boardList.items[boardList.selectedIndex];
    expect(selectedItem.board).to.be.deep.equal(uno);
    expect(selectedItem.port).to.be.deep.equal(unoSerialPort);

    // detach board
    notificationCenter.notifyDetectedPortsDidChange({
      detectedPorts: {},
    });
    boardList = boardsServiceProvider.boardList;
    expect(boardsServiceProvider.boardList.selectedIndex).to.be.equal(-1);
    selectedItem = boardList.items[boardList.selectedIndex];
    expect(selectedItem).to.be.undefined;
  });

  it('should update the board selection history for the port', () => {
    notificationCenter.notifyDetectedPortsDidChange({
      detectedPorts: {
        ...detectedPort(undiscoveredSerialPort),
        ...detectedPort(unoSerialPort, uno),
        ...detectedPort(mkr1000SerialPort, mkr1000),
      },
    });

    boardsServiceProvider.updateConfig({
      selectedBoard: esp32S3DevModule,
      selectedPort: undiscoveredSerialPort,
    });

    expect(boardsServiceProvider['_boardListHistory']).to.be.deep.equal({
      [Port.keyOf(undiscoveredSerialPort)]: esp32S3DevModule,
    });

    boardsServiceProvider.updateConfig({
      selectedBoard: esp32S3DevModule,
      selectedPort: unoSerialPort,
    });

    expect(boardsServiceProvider['_boardListHistory']).to.be.deep.equal({
      [Port.keyOf(undiscoveredSerialPort)]: esp32S3DevModule,
      [Port.keyOf(unoSerialPort)]: esp32S3DevModule,
    });

    boardsServiceProvider.updateConfig({
      selectedBoard: uno,
      selectedPort: unoSerialPort,
    });

    expect(boardsServiceProvider['_boardListHistory']).to.be.deep.equal({
      [Port.keyOf(undiscoveredSerialPort)]: esp32S3DevModule,
    });
  });

  type UpdateBoardListHistoryParams = Parameters<
    BoardsServiceProvider['maybeUpdateBoardListHistory']
  >[0];
  type BoardListHistoryUpdateResult = ReturnType<
    BoardsServiceProvider['maybeUpdateBoardListHistory']
  >;
  interface BoardListHistoryTestSuite {
    readonly init: BoardsConfig;
    readonly detectedPorts?: DetectedPorts;
    readonly params: UpdateBoardListHistoryParams;
    readonly expected: BoardListHistoryUpdateResult;
    /**
     * Optional test title extension.
     */
    readonly description?: string;
    /**
     * Optional test assertions.
     */
    readonly assert?: (
      actual: BoardListHistoryUpdateResult,
      service: BoardsServiceProvider
    ) => void;
  }

  const boardListHistoryTestSuites: BoardListHistoryTestSuite[] = [
    {
      description: "'portToSelect' is undefined",
      init: { selectedBoard: uno, selectedPort: unoSerialPort },
      params: { boardToSelect: mkr1000, portToSelect: undefined },
      expected: undefined,
    },
    {
      description: "'boardToSelect' is undefined",
      init: { selectedBoard: uno, selectedPort: unoSerialPort },
      params: { boardToSelect: undefined, portToSelect: mkr1000SerialPort },
      expected: undefined,
    },
    {
      description: "'selectedBoard' fallback when 'ignore-board'",
      init: { selectedBoard: uno, selectedPort: unoSerialPort },
      params: {
        boardToSelect: 'ignore-board',
        portToSelect: mkr1000SerialPort,
      },
      expected: { [Port.keyOf(mkr1000SerialPort)]: uno },
    },
    {
      description: "'selectedPort' fallback when 'ignore-port'",
      init: { selectedBoard: uno, selectedPort: unoSerialPort },
      params: {
        boardToSelect: mkr1000,
        portToSelect: 'ignore-port',
      },
      expected: { [Port.keyOf(unoSerialPort)]: mkr1000 },
    },
    {
      description:
        'unsets history when board+port is from a detected port from a discovered board',
      init: { selectedBoard: undefined, selectedPort: undefined },
      params: {
        boardToSelect: uno,
        portToSelect: unoSerialPort,
      },
      detectedPorts: {
        ...detectedPort(unoSerialPort, uno),
      },
      expected: { [Port.keyOf(unoSerialPort)]: undefined },
    },
  ];
  boardListHistoryTestSuites.forEach((suite, index) =>
    it(`should handle board list history updates (${
      suite.description ? suite.description : `#${index + 1}`
    })`, () => {
      const { init, params, expected, assert, detectedPorts } = suite;
      boardsServiceProvider['_boardsConfig'] = init;
      if (detectedPorts) {
        notificationCenter.notifyDetectedPortsDidChange({ detectedPorts });
      }
      const actual =
        boardsServiceProvider['maybeUpdateBoardListHistory'](params);
      expect(actual).to.be.deep.equal(expected);
      assert?.(actual, boardsServiceProvider);
    })
  );

  function createContainer(): Container {
    const container = new Container({ defaultScope: 'Singleton' });
    container.load(
      new ContainerModule((bind, unbind, isBound, rebind) => {
        bindBrowser(bind, unbind, isBound, rebind);
        bind(MessageService).toConstantValue(<MessageService>{});
        bind(BoardsService).toConstantValue(<BoardsService>{
          getDetectedPorts() {
            return {};
          },
        });
        bind(NotificationCenter).toSelf().inSingletonScope();
        bind(NotificationServiceServer).toConstantValue(<
          NotificationServiceServer
        >{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          setClient(_) {
            // nothing
          },
        });
        bind(FrontendApplicationStateService).toSelf().inSingletonScope();
        bind(BoardsDataStore).toConstantValue(<BoardsDataStore>{});
        bind(LocalStorageService).toSelf().inSingletonScope();
        bind(WindowService).toConstantValue(<WindowService>{});
        bind(StorageService).toService(LocalStorageService);
        bind(BoardsServiceProvider).toSelf().inSingletonScope();
      })
    );
    return container;
  }
});
