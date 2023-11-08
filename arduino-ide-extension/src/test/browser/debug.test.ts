import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
const disableJSDOM = enableJSDOM();

import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
FrontendApplicationConfigProvider.set({});

import { DisposableCollection } from '@theia/core/lib/common/disposable';

import { CommandEvent, CommandRegistry } from '@theia/core/lib/common/command';
import { Emitter } from '@theia/core/lib/common/event';
import { deepClone } from '@theia/core/lib/common/objects';
import { wait } from '@theia/core/lib/common/promise-util';
import { Mutable } from '@theia/core/lib/common/types';
import {
  Container,
  ContainerModule,
  injectable,
} from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { doesNotReject, rejects } from 'node:assert/strict';
import {
  BoardsDataStore,
  BoardsDataStoreChangeEvent,
} from '../../browser/boards/boards-data-store';
import { BoardsServiceProvider } from '../../browser/boards/boards-service-provider';
import {
  Debug,
  debuggingNotSupported,
  isDebugEnabled,
  noPlatformInstalledFor,
  noProgrammerSelectedFor,
} from '../../browser/contributions/debug';
import { NotificationCenter } from '../../browser/notification-center';
import { noBoardSelected } from '../../common/nls';
import {
  BoardsConfigChangeEvent,
  BoardsPackage,
  CompileSummary,
  ExecutableService,
  type BoardDetails,
  type Programmer,
} from '../../common/protocol';
import {
  BoardsConfig,
  emptyBoardsConfig,
} from '../../common/protocol/boards-service';
import { bindSketchesContribution } from './browser-test-bindings';
import { aPackage } from './fixtures/boards';

disableJSDOM();

describe('debug', () => {
  describe('isDebugEnabled', () => {
    const fqbn = 'a:b:c';
    const name = 'ABC';
    const board = { fqbn, name };
    const p1: Programmer = { id: 'p1', name: 'P1', platform: 'The platform' };
    const p2: Programmer = { id: 'p2', name: 'P2', platform: 'The platform' };
    const data: BoardsDataStore.Data = {
      configOptions: [],
      defaultProgrammerId: 'p1',
      programmers: [p1, p2],
      selectedProgrammer: p1,
    };
    const boardDetails: BoardDetails = {
      buildProperties: [],
      configOptions: [],
      defaultProgrammerId: 'p1',
      programmers: [p1, p2],
      fqbn,
      PID: '0',
      VID: '0',
      requiredTools: [],
    };

    it('should error when no board selected', async () => {
      await rejects(
        isDebugEnabled(
          undefined,
          unexpectedCall(),
          unexpectedCall(),
          unexpectedCall(),
          unexpectedCall()
        ),
        (reason) =>
          reason instanceof Error && reason.message === noBoardSelected
      );
    });

    it('should error when platform is not installed (FQBN is undefined)', async () => {
      await rejects(
        isDebugEnabled(
          { name, fqbn: undefined },
          unexpectedCall(),
          unexpectedCall(),
          unexpectedCall(),
          unexpectedCall()
        ),
        (reason) =>
          reason instanceof Error &&
          reason.message === noPlatformInstalledFor(board.name)
      );
    });

    it('should error when platform is not installed (board details not available)', async () => {
      await rejects(
        isDebugEnabled(
          board,
          () => undefined,
          () => data,
          (fqbn) => fqbn,
          unexpectedCall()
        ),
        (reason) =>
          reason instanceof Error &&
          reason.message === noPlatformInstalledFor(board.name)
      );
    });

    it('should error when no programmer selected', async () => {
      const copyData: Mutable<BoardsDataStore.Data> = deepClone(data);
      delete copyData.selectedProgrammer;
      await rejects(
        isDebugEnabled(
          board,
          () => boardDetails,
          () => copyData,
          (fqbn) => fqbn,
          unexpectedCall()
        ),
        (reason) =>
          reason instanceof Error &&
          reason.message === noProgrammerSelectedFor(board.name)
      );
    });

    it('should error when it fails to get the debug info from the CLI', async () => {
      await rejects(
        isDebugEnabled(
          board,
          () => boardDetails,
          () => data,
          (fqbn) => fqbn,
          () => {
            throw new Error('unhandled error');
          }
        ),
        (reason) =>
          reason instanceof Error &&
          reason.message === debuggingNotSupported(board.name)
      );
    });

    it('should resolve when debugging is supported', async () => {
      await doesNotReject(
        isDebugEnabled(
          board,
          () => boardDetails,
          () => data,
          (fqbn) => fqbn,
          () => Promise.resolve(`${fqbn}:USBMode=hwcdc`)
        )
      );
    });

    describe('onDidChangeMessage', () => {
      let debug: MockDebug;
      let onDidChangeMessageEvents: (string | undefined)[];

      let toDisposeAfterEach: DisposableCollection;
      let mockBoardsConfig: BoardsConfig;
      let mockBoardsConfigDidChangeEmitter: Emitter<BoardsConfigChangeEvent>;
      let mockPlatformDidInstallEmitter: Emitter<{ item: BoardsPackage }>;
      let mockPlatformDidUninstallEmitter: Emitter<{ item: BoardsPackage }>;
      let mockBoardsDataStoreDidChangeEmitter: Emitter<BoardsDataStoreChangeEvent>;
      let mockDidExecuteCommandEmitter: Emitter<CommandEvent>;

      beforeEach(() => {
        mockBoardsConfig = emptyBoardsConfig();
        mockBoardsConfigDidChangeEmitter = new Emitter();
        mockPlatformDidInstallEmitter = new Emitter();
        mockPlatformDidUninstallEmitter = new Emitter();
        mockBoardsDataStoreDidChangeEmitter = new Emitter();
        mockDidExecuteCommandEmitter = new Emitter();
        toDisposeAfterEach = new DisposableCollection(
          mockBoardsConfigDidChangeEmitter,
          mockPlatformDidInstallEmitter,
          mockPlatformDidUninstallEmitter,
          mockBoardsDataStoreDidChangeEmitter,
          mockDidExecuteCommandEmitter
        );

        const container = createContainer();
        const d = container.get<Debug>(Debug);
        expect(d).to.be.an.instanceOf(MockDebug);
        debug = d as MockDebug;

        onDidChangeMessageEvents = [];
        toDisposeAfterEach.push(
          debug['onDidChangeMessage']((event) => {
            onDidChangeMessageEvents.push(event);
          })
        );

        const commandRegistry: Mutable<CommandRegistry> =
          container.get<CommandRegistry>(CommandRegistry);
        commandRegistry['onDidExecuteCommand'] =
          mockDidExecuteCommandEmitter.event;
        debug.onStart();
      });

      it('should update on board identifier change', async () => {
        mockBoardsConfigDidChangeEmitter.fire({
          previousSelectedBoard: undefined,
          selectedBoard: { fqbn: 'a:b:c', name: 'ABC' },
        });
        await wait(1);

        expect(onDidChangeMessageEvents).deep.equal([undefined]);
      });

      it('should not update on port identifier change', async () => {
        mockBoardsConfigDidChangeEmitter.fire({
          previousSelectedPort: undefined,
          selectedPort: { protocol: 'serial', address: 'COM1' },
        });
        await wait(1);

        expect(onDidChangeMessageEvents).to.be.empty;
      });

      it('should update on platform install', async () => {
        mockPlatformDidInstallEmitter.fire({
          item: aPackage,
        });
        await wait(1);

        expect(onDidChangeMessageEvents).deep.equal([undefined]);
      });

      it('should update on platform uninstall', async () => {
        mockPlatformDidUninstallEmitter.fire({
          item: aPackage,
        });
        await wait(1);

        expect(onDidChangeMessageEvents).deep.equal([undefined]);
      });

      it('should update on boards data store change when affects the selected board', async () => {
        mockBoardsConfig = {
          selectedBoard: { fqbn: 'a:b:c', name: '' },
          selectedPort: undefined,
        };
        mockBoardsDataStoreDidChangeEmitter.fire({
          changes: [
            {
              fqbn: 'a:b:c',
              data: BoardsDataStore.Data.EMPTY, // it does not matter
            },
          ],
        });
        await wait(1);

        expect(onDidChangeMessageEvents).deep.equal([undefined]);
      });

      it('should not update on boards data store change when does not affect the selected board', async () => {
        mockBoardsConfig = {
          selectedBoard: { fqbn: 'a:b:c', name: '' },
          selectedPort: undefined,
        };
        mockBoardsDataStoreDidChangeEmitter.fire({
          changes: [
            {
              fqbn: 'x:y:z',
              data: BoardsDataStore.Data.EMPTY, // it does not matter
            },
          ],
        });
        await wait(1);

        expect(onDidChangeMessageEvents).to.be.empty;
      });

      it('should update after verify', async () => {
        const summary: CompileSummary = {
          buildPath: '',
          buildProperties: [],
          executableSectionsSize: [],
          usedLibraries: [],
          boardPlatform: undefined,
          buildPlatform: undefined,
          buildOutputUri: '',
        };
        mockDidExecuteCommandEmitter.fire({
          commandId: 'arduino.languageserver.notifyBuildDidComplete',
          args: [summary],
        });
        await wait(1);

        expect(onDidChangeMessageEvents).deep.equal([undefined]);
      });

      it('should not update when unrelated command executes', async () => {
        mockDidExecuteCommandEmitter.fire({
          commandId: 'other.command',
          args: [],
        });
        await wait(1);

        expect(onDidChangeMessageEvents).to.be.empty;
      });

      it('should update the error message', async () => {
        debug.isDebugEnabledMock = Promise.reject(new Error('my error'));
        mockBoardsConfigDidChangeEmitter.fire({
          previousSelectedBoard: undefined,
          selectedBoard: { fqbn: 'a:b:c', name: 'ABC' },
        });
        await wait(1);

        expect(onDidChangeMessageEvents).deep.equal(['my error']);
      });

      afterEach(() => toDisposeAfterEach.dispose());

      function createContainer(): Container {
        const container = new Container({ defaultScope: 'Singleton' });
        container.load(
          new ContainerModule((bind, unbind, isBound, rebind) => {
            bind(MockDebug).toSelf().inSingletonScope();
            bind(Debug).toService(MockDebug);
            bindSketchesContribution(bind, unbind, isBound, rebind);
            bind(ExecutableService).toConstantValue(<ExecutableService>{});
            rebind(NotificationCenter).toConstantValue(<NotificationCenter>{
              get onPlatformDidInstall() {
                return mockPlatformDidInstallEmitter.event;
              },
              get onPlatformDidUninstall() {
                return mockPlatformDidUninstallEmitter.event;
              },
            });
            rebind(BoardsServiceProvider).toConstantValue(<
              BoardsServiceProvider
            >{
              get onBoardsConfigDidChange() {
                return mockBoardsConfigDidChangeEmitter.event;
              },
              get boardsConfig() {
                return mockBoardsConfig;
              },
            });
            rebind(BoardsDataStore).toConstantValue(<BoardsDataStore>{
              get onDidChange() {
                return mockBoardsDataStoreDidChangeEmitter.event;
              },
            });
          })
        );
        return container;
      }
    });

    function unexpectedCall(): () => never {
      return () => expect.fail('unexpected call');
    }
  });
});

@injectable()
class MockDebug extends Debug {
  isDebugEnabledMock: Promise<string> = Promise.resolve('a:b:c:USBMode:hwcdc');

  constructor() {
    super();
    this['isDebugEnabled'] = () => this.isDebugEnabledMock;
  }
}
