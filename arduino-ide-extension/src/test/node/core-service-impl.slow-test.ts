import { CancellationTokenSource } from '@theia/core/lib/common/cancellation';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { Disposable } from '@theia/core/lib/common/disposable';
import { isWindows } from '@theia/core/lib/common/os';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Container, injectable } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import {
  BoardsService,
  CoreService,
  SketchesService,
} from '../../common/protocol';
import {
  configureBackendApplicationConfigProvider,
  createBaseContainer,
  startDaemon,
} from './test-bindings';

const testTimeout = 30_000;
const setupTimeout = 5 * 60 * 1_000; // five minutes
const avr = 'arduino:avr';
const uno = 'arduino:avr:uno';

describe('core-service-impl', () => {
  let container: Container;
  let toDispose: Disposable[];

  before(() => {
    configureBackendApplicationConfigProvider();
  });

  beforeEach(async function () {
    this.timeout(setupTimeout);
    toDispose = [];
    container = createContainer();
    await start(container, toDispose);
  });

  afterEach(() => {
    let disposable = toDispose.pop();
    while (disposable) {
      try {
        disposable?.dispose();
      } catch {}
      disposable = toDispose.pop();
    }
  });

  describe('compile', () => {
    it('should execute a command with the build path', async function () {
      this.timeout(testTimeout);
      const coreService = container.get<CoreService>(CoreService);
      const sketchesService = container.get<SketchesService>(SketchesService);
      const commandService =
        container.get<TestCommandRegistry>(TestCommandRegistry);
      const sketch = await sketchesService.createNewSketch();

      await coreService.compile({
        fqbn: uno,
        sketch,
        optimizeForDebug: false,
        sourceOverride: {},
        verbose: true,
      });

      const executedBuildDidCompleteCommands =
        commandService.executedCommands.filter(
          ([command]) =>
            command === 'arduino.languageserver.notifyBuildDidComplete'
        );
      expect(executedBuildDidCompleteCommands.length).to.be.equal(1);
      const [, args] = executedBuildDidCompleteCommands[0];
      expect(args.length).to.be.equal(1);
      const arg = args[0];
      expect(typeof arg).to.be.equal('object');
      expect('buildOutputUri' in arg).to.be.true;
      expect(arg.buildOutputUri).to.be.not.undefined;

      const tempBuildPaths = await sketchesService.tempBuildPath(sketch);
      if (isWindows) {
        expect(tempBuildPaths.length).to.be.greaterThan(1);
      } else {
        expect(tempBuildPaths.length).to.be.equal(1);
      }

      const { buildOutputUri } = arg;
      const buildOutputPath = FileUri.fsPath(buildOutputUri).toString();
      expect(tempBuildPaths.includes(buildOutputPath)).to.be.true;
    });
  });
});

async function start(
  container: Container,
  toDispose: Disposable[]
): Promise<void> {
  await startDaemon(container, toDispose, async (container) => {
    const boardService = container.get<BoardsService>(BoardsService);
    const searchResults = await boardService.search({ query: avr });
    const platform = searchResults.find(({ id }) => id === avr);
    if (!platform) {
      throw new Error(`Could not find platform: ${avr}`);
    }
    await boardService.install({ item: platform, skipPostInstall: true });
  });
}

function createContainer(): Container {
  return createBaseContainer((bind) => {
    bind(TestCommandRegistry).toSelf().inSingletonScope();
    bind(CommandRegistry).toService(TestCommandRegistry);
  });
}

@injectable()
class TestCommandRegistry extends CommandRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly executedCommands: [string, any[]][] = [];

  override async executeCommand<T>(
    commandId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ): Promise<T | undefined> {
    const { token } = new CancellationTokenSource();
    this.onWillExecuteCommandEmitter.fire({
      commandId,
      args,
      token,
      waitUntil: () => {
        // NOOP
      },
    });
    this.executedCommands.push([commandId, args]);
    this.onDidExecuteCommandEmitter.fire({ commandId, args });
    return undefined;
  }
}
