import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { isWindows } from '@theia/core/lib/common/os';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import {
  BoardsService,
  CompileSummary,
  CoreService,
  SketchesService,
  isCompileSummary,
} from '../../common/protocol';
import { createBaseContainer, startDaemon } from './node-test-bindings';

const testTimeout = 30_000;
const setupTimeout = 5 * 60 * 1_000; // five minutes
const avr = 'arduino:avr';
const uno = 'arduino:avr:uno';

describe('core-service-impl', () => {
  let container: Container;
  let toDispose: DisposableCollection;

  beforeEach(async function () {
    this.timeout(setupTimeout);
    toDispose = new DisposableCollection();
    container = await createContainer();
    await start(container, toDispose);
  });

  afterEach(() => toDispose.dispose());

  describe('compile', () => {
    it('should execute a command with the compile summary, including the build path', async function () {
      this.timeout(testTimeout);
      const coreService = container.get<CoreService>(CoreService);
      const sketchesService = container.get<SketchesService>(SketchesService);
      const sketch = await sketchesService.createNewSketch();

      const compileSummary = await coreService.compile({
        fqbn: uno,
        sketch,
        optimizeForDebug: false,
        sourceOverride: {},
        verbose: true,
      });

      expect(isCompileSummary(compileSummary)).to.be.true;
      expect((<CompileSummary>compileSummary).buildOutputUri).to.be.not
        .undefined;

      const tempBuildPaths = await sketchesService.getBuildPath(sketch);
      if (isWindows) {
        expect(tempBuildPaths.length).to.be.greaterThan(1);
      } else {
        expect(tempBuildPaths.length).to.be.equal(1);
      }

      const { buildOutputUri } = <CompileSummary>compileSummary;
      const buildOutputPath = FileUri.fsPath(buildOutputUri).toString();
      expect(tempBuildPaths.includes(buildOutputPath)).to.be.true;
    });
  });
});

async function start(
  container: Container,
  toDispose: DisposableCollection
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

async function createContainer(): Promise<Container> {
  return createBaseContainer();
}
