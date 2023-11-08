import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { Emitter } from '@theia/core/lib/common/event';
import { wait } from '@theia/core/lib/common/promise-util';
import URI from '@theia/core/lib/common/uri';
import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import type {
  BoardDetails as ApiBoardDetails,
  CompileSummary as ApiCompileSummary,
  Port as ApiPort,
} from 'vscode-arduino-api';
import { URI as CodeURI } from 'vscode-uri';
import {
  BoardsDataStore,
  BoardsDataStoreChangeEvent,
} from '../../browser/boards/boards-data-store';
import { BoardsServiceProvider } from '../../browser/boards/boards-service-provider';
import { ConfigServiceClient } from '../../browser/config/config-service-client';
import { CommandRegistry } from '../../browser/contributions/contribution';
import {
  UpdateArduinoState,
  UpdateStateParams,
} from '../../browser/contributions/update-arduino-state';
import { NotificationCenter } from '../../browser/notification-center';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../browser/sketches-service-client-impl';
import { CompileSummary } from '../../common/protocol';
import {
  BoardDetails,
  BoardsService,
  Port,
} from '../../common/protocol/boards-service';
import { bindSketchesContribution } from './browser-test-bindings';

disableJSDOM();

describe('update-arduino-state', function () {
  this.slow(250);

  let toDisposeAfterEach: DisposableCollection;
  let boardsServiceProvider: BoardsServiceProvider;
  let notificationCenter: NotificationCenter;
  let commandRegistry: CommandRegistry;
  let updateArduinoState: UpdateArduinoState;
  let stateUpdateParams: UpdateStateParams[];

  let boardDetailsMocks: Record<string, BoardDetails>;
  let dataStoreMocks: Record<string, BoardsDataStore.Data>;
  let currentSketchMock: CurrentSketch | undefined;
  let sketchDirUriMock: URI | undefined;
  let dataDirUriMock: URI | undefined;
  let onCurrentSketchDidChangeEmitter: Emitter<CurrentSketch>;
  let onDataDirDidChangeEmitter: Emitter<URI | undefined>;
  let onSketchDirDidChangeEmitter: Emitter<URI | undefined>;
  let onDataStoreDidChangeEmitter: Emitter<BoardsDataStoreChangeEvent>;

  beforeEach(async () => {
    toDisposeAfterEach = new DisposableCollection();
    stateUpdateParams = [];

    // reset mocks
    boardDetailsMocks = {};
    dataStoreMocks = {};
    currentSketchMock = undefined;
    sketchDirUriMock = undefined;
    dataDirUriMock = undefined;
    onCurrentSketchDidChangeEmitter = new Emitter();
    onDataDirDidChangeEmitter = new Emitter();
    onSketchDirDidChangeEmitter = new Emitter();
    onDataStoreDidChangeEmitter = new Emitter();
    toDisposeAfterEach.pushAll([
      onCurrentSketchDidChangeEmitter,
      onDataDirDidChangeEmitter,
      onSketchDirDidChangeEmitter,
      onDataStoreDidChangeEmitter,
    ]);

    const container = createContainer();
    commandRegistry = container.get<CommandRegistry>(CommandRegistry);
    // This command is registered by vscode-arduino-api
    commandRegistry.registerCommand(
      { id: 'arduinoAPI.updateState' },
      {
        execute: (params: UpdateStateParams) => stateUpdateParams.push(params),
      }
    );
    // This command is contributed by the vscode-arduino-tools VSIX
    commandRegistry.registerCommand(
      { id: 'arduino.languageserver.notifyBuildDidComplete' },
      {
        execute: () => {
          /* NOOP */
        },
      }
    );
    container.get<FrontendApplicationStateService>(
      FrontendApplicationStateService
    ).state = 'ready';
    boardsServiceProvider = container.get<BoardsServiceProvider>(
      BoardsServiceProvider
    );
    notificationCenter = container.get<NotificationCenter>(NotificationCenter);
    updateArduinoState = container.get<UpdateArduinoState>(UpdateArduinoState);
    toDisposeAfterEach.push(
      Disposable.create(() => boardsServiceProvider.onStop())
    );
    boardsServiceProvider.onStart();
    await boardsServiceProvider.ready;
    updateArduinoState.onStart();

    await wait(50);
    stateUpdateParams = [];
  });

  afterEach(() => {
    toDisposeAfterEach.dispose();
  });

  it('should automatically update the boards config (board+port) on ready', async () => {
    const fqbn = 'a:b:c';
    const board = { fqbn, name: 'ABC' };
    const boardDetails: BoardDetails = {
      buildProperties: [],
      configOptions: [],
      defaultProgrammerId: undefined,
      fqbn,
      PID: '0',
      VID: '0',
      programmers: [],
      requiredTools: [],
    };
    boardDetailsMocks = {
      'a:b:c': boardDetails,
    };
    const port = { address: 'COM1', protocol: 'serial' };
    boardsServiceProvider['_boardsConfig'] = {
      selectedBoard: board,
      selectedPort: port,
    };
    boardsServiceProvider['_detectedPorts'] = {
      [Port.keyOf(port)]: {
        port: {
          address: 'COM1',
          addressLabel: 'COM1 Port',
          protocol: 'serial',
          protocolLabel: 'Serial',
        },
        boards: [],
      },
    };

    updateArduinoState.onReady();
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) =>
        param.key === 'fqbn' ||
        param.key === 'boardDetails' ||
        param.key === 'port'
    );
    expect(params).to.be.deep.equal([
      { key: 'fqbn', value: 'a:b:c' },
      {
        key: 'boardDetails',
        value: {
          buildProperties: {},
          configOptions: [],
          fqbn: 'a:b:c',
          programmers: [],
          toolsDependencies: [],
        } as ApiBoardDetails,
      },
      {
        key: 'port',
        value: {
          address: 'COM1',
          protocol: 'serial',
          protocolLabel: 'Serial',
          hardwareId: '',
          label: 'COM1 Port',
          properties: {},
        } as ApiPort,
      },
    ]);
  });

  it('should automatically update the sketch path on ready', async () => {
    const uri = 'file:///path/to/my_sketch';
    currentSketchMock = {
      name: 'my_sketch',
      uri,
      mainFileUri: 'file:///path/to/my_sketch/my_sketch.ino',
      additionalFileUris: [],
      otherSketchFileUris: [],
      rootFolderFileUris: [],
    };

    updateArduinoState.onReady();
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) => param.key === 'sketchPath'
    );
    expect(params).to.be.deep.equal([
      {
        key: 'sketchPath',
        value: CodeURI.parse(uri).fsPath,
      },
    ]);
  });

  it("should automatically update the 'directories.data' path on ready", async () => {
    const uri = 'file:///path/to/data/dir';
    dataDirUriMock = new URI(uri);

    stateUpdateParams = [];
    updateArduinoState.onReady();
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) => param.key === 'dataDirPath'
    );
    expect(params).to.be.deep.equal([
      {
        key: 'dataDirPath',
        value: CodeURI.parse(uri).fsPath,
      },
    ]);
  });

  it("should automatically update the 'directories.user' path on ready", async () => {
    const uri = 'file:///path/to/sketchbook';
    sketchDirUriMock = new URI(uri);

    updateArduinoState.onReady();
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) => param.key === 'userDirPath'
    );
    expect(params).to.be.deep.equal([
      {
        key: 'userDirPath',
        value: CodeURI.parse(uri).fsPath,
      },
    ]);
  });

  it('should update the boards config (board only) when did change', async () => {
    const fqbn = 'a:b:c';
    const board = { fqbn, name: 'ABC' };
    const boardDetails = {
      buildProperties: [],
      configOptions: [],
      defaultProgrammerId: undefined,
      fqbn,
      PID: '0',
      VID: '0',
      programmers: [],
      requiredTools: [],
    };
    boardDetailsMocks = {
      'a:b:c': boardDetails,
    };
    boardsServiceProvider.updateConfig(board);
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) =>
        param.key === 'fqbn' ||
        param.key === 'boardDetails' ||
        param.key === 'port'
    );
    expect(params).to.be.deep.equal([
      { key: 'fqbn', value: 'a:b:c' },
      {
        key: 'boardDetails',
        value: {
          buildProperties: {},
          configOptions: [],
          fqbn: 'a:b:c',
          programmers: [],
          toolsDependencies: [],
        } as ApiBoardDetails,
      },
      { key: 'port', value: undefined },
    ]);
  });

  it('should update the boards config (port only) when did change', async () => {
    const port = { address: 'COM1', protocol: 'serial' };
    notificationCenter.notifyDetectedPortsDidChange({
      detectedPorts: {
        [Port.keyOf(port)]: {
          port: {
            address: 'COM1',
            addressLabel: 'COM1 Port',
            protocol: 'serial',
            protocolLabel: 'Serial',
          },
          boards: [],
        },
      },
    });
    boardsServiceProvider.updateConfig(port);
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) =>
        param.key === 'fqbn' ||
        param.key === 'boardDetails' ||
        param.key === 'port'
    );
    expect(params).to.be.deep.equal([
      { key: 'fqbn', value: undefined },
      { key: 'boardDetails', value: undefined },
      {
        key: 'port',
        value: {
          address: 'COM1',
          protocol: 'serial',
          protocolLabel: 'Serial',
          hardwareId: '',
          label: 'COM1 Port',
          properties: {},
        } as ApiPort,
      },
    ]);
  });

  it('should update the boards config (board+port) when did change', async () => {
    const fqbn = 'a:b:c';
    const board = { fqbn, name: 'ABC' };
    const boardDetails = {
      buildProperties: [],
      configOptions: [],
      defaultProgrammerId: undefined,
      fqbn,
      PID: '0',
      VID: '0',
      programmers: [],
      requiredTools: [],
    };
    boardDetailsMocks = {
      'a:b:c': boardDetails,
    };
    const port = { address: 'COM1', protocol: 'serial' };
    boardsServiceProvider.updateConfig({
      selectedBoard: board,
      selectedPort: port,
    });
    notificationCenter.notifyDetectedPortsDidChange({
      detectedPorts: {
        [Port.keyOf(port)]: {
          port: {
            address: 'COM1',
            addressLabel: 'COM1 Port',
            protocol: 'serial',
            protocolLabel: 'Serial',
          },
          boards: [],
        },
      },
    });
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) =>
        param.key === 'fqbn' ||
        param.key === 'boardDetails' ||
        param.key === 'port'
    );
    expect(params).to.be.deep.equal([
      { key: 'fqbn', value: 'a:b:c' },
      {
        key: 'boardDetails',
        value: {
          buildProperties: {},
          configOptions: [],
          fqbn: 'a:b:c',
          programmers: [],
          toolsDependencies: [],
        } as ApiBoardDetails,
      },
      {
        key: 'port',
        value: {
          address: 'COM1',
          protocol: 'serial',
          protocolLabel: 'Serial',
          hardwareId: '',
          label: 'COM1 Port',
          properties: {},
        } as ApiPort,
      },
    ]);
  });

  it('should update the compile summary after a verify', async () => {
    const summary: CompileSummary = {
      buildPath: '/path/to/build',
      buildProperties: [],
      executableSectionsSize: [],
      usedLibraries: [],
      boardPlatform: undefined,
      buildPlatform: undefined,
      buildOutputUri: 'file:///path/to/build',
    };
    await commandRegistry.executeCommand(
      'arduino.languageserver.notifyBuildDidComplete',
      summary
    );
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) => param.key === 'compileSummary'
    );
    expect(params).to.be.deep.equal([
      {
        key: 'compileSummary',
        value: {
          buildPath: '/path/to/build',
          buildProperties: {},
          executableSectionsSize: [],
          usedLibraries: [],
          boardPlatform: undefined,
          buildPlatform: undefined,
        } as ApiCompileSummary,
      },
    ]);
  });

  it('should update the current sketch when did change', async () => {
    const uri = 'file:///path/to/my_sketch';
    const sketch = {
      name: 'my_sketch',
      uri,
      mainFileUri: 'file:///path/to/my_sketch/my_sketch.ino',
      additionalFileUris: [],
      otherSketchFileUris: [],
      rootFolderFileUris: [],
    };
    onCurrentSketchDidChangeEmitter.fire(sketch);
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) => param.key === 'sketchPath'
    );
    expect(params).to.be.deep.equal([
      {
        key: 'sketchPath',
        value: CodeURI.parse(uri).fsPath,
      },
    ]);
  });

  it("should update the 'directories.data' when did change", async () => {
    const uri = new URI('file:///path/to/data/dir');
    onDataDirDidChangeEmitter.fire(uri);
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) => param.key === 'dataDirPath'
    );
    expect(params).to.be.deep.equal([
      {
        key: 'dataDirPath',
        value: CodeURI.parse(uri.toString()).fsPath,
      },
    ]);
  });

  it("should update the 'directories.user' when did change", async () => {
    const uri = new URI('file:///path/to/sketchbook');
    onSketchDirDidChangeEmitter.fire(uri);
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) => param.key === 'userDirPath'
    );
    expect(params).to.be.deep.equal([
      {
        key: 'userDirPath',
        value: CodeURI.parse(uri.toString()).fsPath,
      },
    ]);
  });

  it('should not update the board details when data store did change but the selected board does not match', async () => {
    onDataStoreDidChangeEmitter.fire({
      changes: [
        {
          fqbn: 'a:b:c',
          // the data does not matter
          data: {
            configOptions: [
              {
                label: 'C1',
                option: 'c1',
                values: [{ label: 'C1V1', selected: true, value: 'c1v1' }],
              },
            ],
            programmers: [],
            defaultProgrammerId: undefined,
          },
        },
      ],
    });
    await wait(50);

    expect(stateUpdateParams).to.be.empty;
  });

  it('should update the board details when the data store did change and the selected board matches', async () => {
    const fqbn = 'a:b:c';
    const board = { fqbn, name: 'ABC' };
    const boardDetails = {
      buildProperties: [],
      configOptions: [],
      defaultProgrammerId: undefined,
      fqbn,
      PID: '0',
      VID: '0',
      programmers: [],
      requiredTools: [],
    };
    boardDetailsMocks = {
      'a:b:c': boardDetails,
    };
    boardsServiceProvider['_boardsConfig'] = {
      selectedBoard: board,
      selectedPort: undefined,
    };

    onDataStoreDidChangeEmitter.fire({
      changes: [
        {
          fqbn: 'a:b:c',
          // the data does not matter
          data: {
            configOptions: [],
            programmers: [{ id: 'p1', name: 'P1', platform: 'The platform' }],
            defaultProgrammerId: 'p1',
          },
        },
      ],
    });
    await wait(50);

    const params = stateUpdateParams.filter(
      (param) =>
        param.key === 'fqbn' ||
        param.key === 'boardDetails' ||
        param.key === 'port'
    );
    expect(params).to.be.deep.equal([
      {
        key: 'boardDetails',
        value: {
          buildProperties: {},
          configOptions: [],
          fqbn: 'a:b:c',
          programmers: [],
          toolsDependencies: [],
        } as ApiBoardDetails,
      },
    ]);
  });

  function createContainer(): Container {
    const container = new Container({ defaultScope: 'Singleton' });
    container.load(
      new ContainerModule((bind, unbind, isBound, rebind) => {
        bindSketchesContribution(bind, unbind, isBound, rebind);
        bind(UpdateArduinoState).toSelf().inSingletonScope();
        rebind(BoardsService).toConstantValue(<BoardsService>{
          getDetectedPorts() {
            return {};
          },
          async getBoardDetails({ fqbn }) {
            return boardDetailsMocks[fqbn];
          },
        });
        rebind(BoardsDataStore).toConstantValue(<BoardsDataStore>{
          async getData(fqbn) {
            if (!fqbn) {
              return BoardsDataStore.Data.EMPTY;
            }
            const data = dataStoreMocks[fqbn] ?? BoardsDataStore.Data.EMPTY;
            return data;
          },
          get onDidChange() {
            return onDataStoreDidChangeEmitter.event;
          },
        });
        rebind(ConfigServiceClient).toConstantValue(<ConfigServiceClient>{
          tryGetSketchDirUri() {
            return sketchDirUriMock;
          },
          tryGetDataDirUri() {
            return dataDirUriMock;
          },
          get onDidChangeSketchDirUri() {
            return onSketchDirDidChangeEmitter.event;
          },
          get onDidChangeDataDirUri() {
            return onDataDirDidChangeEmitter.event;
          },
        });
        rebind(SketchesServiceClientImpl).toConstantValue(<
          SketchesServiceClientImpl
        >{
          tryGetCurrentSketch() {
            return currentSketchMock;
          },
          onCurrentSketchDidChange: onCurrentSketchDidChangeEmitter.event,
        });
      })
    );
    return container;
  }
});
