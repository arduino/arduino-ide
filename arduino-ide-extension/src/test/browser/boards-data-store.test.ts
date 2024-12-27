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
import { wait } from '@theia/core/lib/common/promise-util';
import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { BoardsDataStore } from '../../browser/boards/boards-data-store';
import { BoardsServiceProvider } from '../../browser/boards/boards-service-provider';
import { NotificationCenter } from '../../browser/notification-center';
import {
  BoardDetails,
  BoardsPackage,
  BoardsService,
  ConfigOption,
  Programmer,
} from '../../common/protocol/boards-service';
import { NotificationServiceServer } from '../../common/protocol/notification-service';
import { bindBrowser } from './browser-test-bindings';

disableJSDOM();

describe('boards-data-store', function () {
  this.slow(250);

  let toDisposeAfterEach: DisposableCollection;
  let boardsServiceProvider: BoardsServiceProvider;
  let boardsDataStore: BoardsDataStore;
  let notificationCenter: NotificationCenter;

  beforeEach(async () => {
    const container = createContainer();
    container.get<FrontendApplicationStateService>(
      FrontendApplicationStateService
    ).state = 'ready';
    notificationCenter = container.get<NotificationCenter>(NotificationCenter);
    boardsServiceProvider = container.get<BoardsServiceProvider>(
      BoardsServiceProvider
    );
    toDisposeAfterEach = new DisposableCollection(
      Disposable.create(() => boardsServiceProvider.onStop())
    );
    boardsServiceProvider.onStart();
    await boardsServiceProvider.ready;
    boardsDataStore = container.get<BoardsDataStore>(BoardsDataStore);
    boardsDataStore.onStart();
  });

  afterEach(() => toDisposeAfterEach.dispose());

  it('should load the board details when absent in local storage', async () => {
    const storedData = await getStoredData(fqbn);
    expect(storedData).to.be.undefined;
    const data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });
  });

  it('should load from local storage if present', async () => {
    const storedData: BoardsDataStore.Data = {
      configOptions: [],
      programmers: [edbg],
    };
    await setStorageData(fqbn, storedData);
    const data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal(storedData);
  });

  it('should update board details of selected board (selected with FQBN)', async () => {
    const updated = boardsServiceProvider.updateConfig(board);
    expect(updated).to.be.ok;
    await wait(1);

    const selectedBoardData = boardsDataStore['_selectedBoardData'];
    expect(selectedBoardData).to.be.deep.equal({
      fqbn,
      data: {
        configOptions: [configOption1],
        programmers: [edbg, jlink],
      },
    });
  });

  it('should not update the board details of selected board when FQBN is missing', async () => {
    const fqbn = undefined;
    const name = 'ABC';
    const board = { name, fqbn };
    const updated = boardsServiceProvider.updateConfig(board);
    expect(updated).to.ok;
    await wait(1);

    const selectedBoardData = boardsDataStore['_selectedBoardData'];
    expect(selectedBoardData).to.be.undefined;
  });

  it('should unset the the board details of selected board when no board was selected', async () => {
    let updated = boardsServiceProvider.updateConfig(board);
    expect(updated).to.ok;
    await wait(1);

    let selectedBoardData = boardsDataStore['_selectedBoardData'];
    expect(selectedBoardData).to.be.deep.equal({
      fqbn,
      data: {
        configOptions: [configOption1],
        programmers: [edbg, jlink],
      },
    });

    updated = boardsServiceProvider.updateConfig('unset-board');
    expect(updated).to.be.true;
    await wait(1);

    selectedBoardData = boardsDataStore['_selectedBoardData'];
    expect(selectedBoardData).to.be.undefined;
  });

  it('should provide startup tasks when the data is available for the selected board', async () => {
    let updated = boardsServiceProvider.updateConfig(board);
    expect(updated).to.be.true;
    await wait(1);

    let tasks = boardsDataStore.tasks();
    expect(tasks).to.be.deep.equal([
      {
        command: 'lingzhi-use-inherited-boards-data',
        args: [
          {
            fqbn,
            data: {
              configOptions: [configOption1],
              programmers: [edbg, jlink],
            },
          },
        ],
      },
    ]);

    updated = boardsServiceProvider.updateConfig('unset-board');
    expect(updated).to.be.true;
    await wait(1);

    tasks = boardsDataStore.tasks();
    expect(tasks).to.be.empty;
  });

  it('should not provide any startup tasks when no data is available for the selected board', async () => {
    const tasks = boardsDataStore.tasks();
    expect(tasks).to.be.empty;
  });

  it('should update the startup task arg when the selected programmer changes', async () => {
    let tasks = boardsDataStore.tasks();
    expect(tasks).to.be.empty;

    let data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });

    const updated = boardsServiceProvider.updateConfig(board);
    expect(updated).to.be.ok;
    await wait(1);

    tasks = boardsDataStore.tasks();
    expect(tasks).to.be.deep.equal([
      {
        command: 'lingzhi-use-inherited-boards-data',
        args: [
          {
            fqbn,
            data: {
              configOptions: [configOption1],
              programmers: [edbg, jlink],
            },
          },
        ],
      },
    ]);

    const result = await boardsDataStore.selectProgrammer({
      fqbn,
      selectedProgrammer: edbg,
    });
    expect(result).to.be.ok;

    data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
      selectedProgrammer: edbg,
    });
    tasks = boardsDataStore.tasks();
    expect(tasks).to.be.deep.equal([
      {
        command: 'lingzhi-use-inherited-boards-data',
        args: [
          {
            fqbn,
            data: {
              configOptions: [configOption1],
              programmers: [edbg, jlink],
              selectedProgrammer: edbg,
            },
          },
        ],
      },
    ]);
  });

  it('should update the startup task arg when the config options change', async () => {
    let tasks = boardsDataStore.tasks();
    expect(tasks).to.be.empty;

    let data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });

    const updated = boardsServiceProvider.updateConfig(board);
    expect(updated).to.be.ok;
    await wait(1);

    tasks = boardsDataStore.tasks();
    expect(tasks).to.be.deep.equal([
      {
        command: 'lingzhi-use-inherited-boards-data',
        args: [
          {
            fqbn,
            data: {
              configOptions: [configOption1],
              programmers: [edbg, jlink],
            },
          },
        ],
      },
    ]);

    const result = await boardsDataStore.selectConfigOption({
      fqbn,
      option: configOption1.option,
      selectedValue: configOption1.values[1].value,
    });
    expect(result).to.be.ok;

    data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [
        {
          ...configOption1,
          values: [
            { label: 'C1V1', selected: false, value: 'v1' },
            { label: 'C1V2', selected: true, value: 'v2' },
          ],
        },
      ],
      programmers: [edbg, jlink],
    });

    tasks = boardsDataStore.tasks();
    expect(tasks).to.be.deep.equal([
      {
        command: 'lingzhi-use-inherited-boards-data',
        args: [
          {
            fqbn,
            data: {
              configOptions: [
                {
                  ...configOption1,
                  values: [
                    { label: 'C1V1', selected: false, value: 'v1' },
                    { label: 'C1V2', selected: true, value: 'v2' },
                  ],
                },
              ],
              programmers: [edbg, jlink],
            },
          },
        ],
      },
    ]);
  });

  it('should select the default programmer', async () => {
    const storedData = await getStoredData(fqbn);
    expect(storedData).to.be.undefined;

    toDisposeAfterEach.push(
      mockBoardDetails([
        {
          fqbn,
          ...baseDetails,
          defaultProgrammerId: edbg.id,
        },
      ])
    );

    const data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
      defaultProgrammerId: edbg.id,
      selectedProgrammer: edbg,
    });
  });

  it('should not select the default programmer when no match', async () => {
    const storedData = await getStoredData(fqbn);
    expect(storedData).to.be.undefined;

    toDisposeAfterEach.push(
      mockBoardDetails([
        {
          fqbn,
          ...baseDetails,
          defaultProgrammerId: 'missing',
        },
      ])
    );

    const data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
      defaultProgrammerId: 'missing',
    });
  });

  it('should select a programmer', async () => {
    let data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });

    let didChangeCounter = 0;
    toDisposeAfterEach.push(
      boardsDataStore.onDidChange(() => didChangeCounter++)
    );
    const result = await boardsDataStore.selectProgrammer({
      fqbn,
      selectedProgrammer: edbg,
    });
    expect(result).to.be.ok;
    expect(didChangeCounter).to.be.equal(1);

    data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
      selectedProgrammer: edbg,
    });
  });

  it('should not select a programmer if it is absent', async () => {
    let data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });

    let didChangeCounter = 0;
    toDisposeAfterEach.push(
      boardsDataStore.onDidChange(() => didChangeCounter++)
    );
    const result = await boardsDataStore.selectProgrammer({
      fqbn,
      selectedProgrammer: { id: 'p1', name: 'P1', platform: 'missing' },
    });
    expect(result).to.be.not.ok;
    expect(didChangeCounter).to.be.equal(0);

    data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });
  });

  it('should select a config option', async () => {
    let data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });

    let didChangeCounter = 0;
    toDisposeAfterEach.push(
      boardsDataStore.onDidChange(() => didChangeCounter++)
    );
    const result = await boardsDataStore.selectConfigOption({
      fqbn,
      option: configOption1.option,
      selectedValue: configOption1.values[1].value,
    });
    expect(result).to.be.ok;
    expect(didChangeCounter).to.be.equal(1);

    data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [
        {
          ...configOption1,
          values: [
            { label: 'C1V1', selected: false, value: 'v1' },
            { label: 'C1V2', selected: true, value: 'v2' },
          ],
        },
      ],
      programmers: [edbg, jlink],
    });
  });

  it('should not select a config option if the option is absent', async () => {
    const fqbn = 'a:b:c';
    let data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });

    let didChangeCounter = 0;
    toDisposeAfterEach.push(
      boardsDataStore.onDidChange(() => didChangeCounter++)
    );
    const result = await boardsDataStore.selectConfigOption({
      fqbn,
      option: 'missing',
      selectedValue: configOption1.values[1].value,
    });
    expect(result).to.be.not.ok;
    expect(didChangeCounter).to.be.equal(0);

    data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });
  });

  it('should not select a config option if the selected value is absent', async () => {
    let data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });

    let didChangeCounter = 0;
    toDisposeAfterEach.push(
      boardsDataStore.onDidChange(() => didChangeCounter++)
    );
    const result = await boardsDataStore.selectConfigOption({
      fqbn,
      option: configOption1.option,
      selectedValue: 'missing',
    });
    expect(result).to.be.not.ok;
    expect(didChangeCounter).to.be.equal(0);

    data = await boardsDataStore.getData(fqbn);
    expect(data).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });
  });

  it('should not update the board data on platform install if it was not cached', async () => {
    let storedData = await getStoredData(fqbn);
    expect(storedData).to.be.undefined;

    let didChangeCounter = 0;
    toDisposeAfterEach.push(
      boardsDataStore.onDidChange(() => didChangeCounter++)
    );
    notificationCenter.notifyPlatformDidInstall({ item: boardsPackage });
    await wait(1);
    expect(didChangeCounter).to.be.equal(0);

    storedData = await getStoredData(fqbn);
    expect(storedData).to.be.undefined;
  });

  it('should update the board data on platform install if the default empty value was cached', async () => {
    let storedData = await getStoredData(fqbn);
    expect(storedData).to.be.undefined;

    await setStorageData(fqbn, BoardsDataStore.Data.EMPTY);
    storedData = await getStoredData(fqbn);
    expect(storedData).to.be.deep.equal(BoardsDataStore.Data.EMPTY);

    let didChangeCounter = 0;
    toDisposeAfterEach.push(
      boardsDataStore.onDidChange(() => didChangeCounter++)
    );
    notificationCenter.notifyPlatformDidInstall({ item: boardsPackage });
    await wait(1);
    expect(didChangeCounter).to.be.equal(1);

    storedData = await getStoredData(fqbn);
    expect(storedData).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });
  });

  it('should update the cached board data on platform install', async () => {
    let storedData = await boardsDataStore.getData(fqbn); // caches the value
    expect(storedData).to.be.deep.equal({
      configOptions: [configOption1],
      programmers: [edbg, jlink],
    });

    // before the platform install event mock a different CLI `board details` output
    toDisposeAfterEach.push(
      mockBoardDetails([
        {
          fqbn,
          ...baseDetails,
          configOptions: [configOption2],
        },
      ])
    );

    let didChangeCounter = 0;
    toDisposeAfterEach.push(
      boardsDataStore.onDidChange(() => didChangeCounter++)
    );
    notificationCenter.notifyPlatformDidInstall({ item: boardsPackage });
    await wait(1);
    expect(didChangeCounter).to.be.equal(1);

    storedData = await boardsDataStore.getData(fqbn);
    expect(storedData).to.be.deep.equal({
      configOptions: [configOption2],
      programmers: [edbg, jlink],
    });
  });

  function storageKey(fqbn: string): string {
    return boardsDataStore['getStorageKey'](fqbn);
  }

  function getStoredData(fqbn: string): Promise<unknown> {
    const key = storageKey(fqbn);
    return boardsDataStore['storageService'].getData(key);
  }

  function setStorageData(
    fqbn: string,
    data: BoardsDataStore.Data
  ): Promise<void> {
    const key = storageKey(fqbn);
    return boardsDataStore['storageService'].setData(key, data);
  }

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
          async getBoardDetails({ fqbn }) {
            return boardDetailsMock().find((mock) => mock.fqbn === fqbn);
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
        bind(BoardsDataStore).toSelf().inSingletonScope();
        bind(LocalStorageService).toSelf().inSingletonScope();
        bind(WindowService).toConstantValue(<WindowService>{});
        bind(StorageService).toService(LocalStorageService);
        bind(BoardsServiceProvider).toSelf().inSingletonScope();
      })
    );
    return container;
  }

  // Mocks the CLI's `board details` response
  const jlink: Programmer = {
    platform: 'Arduino SAMD (32-bits ARM Cortex-M0+) Boards',
    id: 'jlink',
    name: 'Segger J-Link',
  };
  const edbg: Programmer = {
    platform: 'Arduino SAMD (32-bits ARM Cortex-M0+) Boards',
    id: 'edbg',
    name: 'Atmel EDBG',
  };

  const configOption1: ConfigOption = {
    label: 'C1',
    option: 'c1',
    values: [
      { label: 'C1V1', selected: true, value: 'v1' },
      { label: 'C1V2', selected: false, value: 'v2' },
    ],
  };

  const configOption2: ConfigOption = {
    label: 'C2',
    option: 'c2',
    values: [
      { label: 'C2V1', selected: true, value: 'v1' },
      { label: 'C2V2', selected: false, value: 'v2' },
    ],
  };

  const baseDetails: Omit<BoardDetails, 'fqbn'> = {
    VID: '1',
    PID: '1',
    buildProperties: [],
    configOptions: [configOption1],
    programmers: [edbg, jlink],
    requiredTools: [],
  };

  const fqbn = 'a:b:c';
  const name = 'ABC';
  const board = { fqbn, name };

  const boardsPackage: BoardsPackage = {
    id: 'a:b',
    name: 'AB',
    availableVersions: ['1.0.0'],
    boards: [board],
    description: 'boy',
    summary: ':heart:',
    author: 'mano',
    types: [],
  };

  const defaultDetailsMocks: readonly BoardDetails[] = [
    {
      fqbn,
      ...baseDetails,
    },
  ];
  let _currentDetailsMock = defaultDetailsMocks;

  function boardDetailsMock(): readonly BoardDetails[] {
    return _currentDetailsMock;
  }
  function mockBoardDetails(newDetails: BoardDetails[]): Disposable {
    _currentDetailsMock = newDetails;
    return Disposable.create(resetDetailsMock);
  }
  function resetDetailsMock(): void {
    _currentDetailsMock = defaultDetailsMocks;
  }
});
