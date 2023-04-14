import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { promises as fs } from 'fs';
import { basename, join } from 'path';
import { sync as rimrafSync } from 'rimraf';
import { Sketch, SketchesService } from '../../common/protocol';
import { SketchesServiceImpl } from '../../node/sketches-service-impl';
import { ErrnoException } from '../../node/utils/errors';
import { createBaseContainer, startDaemon } from './test-bindings';

const testTimeout = 10_000;

describe('sketches-service-impl', () => {
  let container: Container;
  let toDispose: DisposableCollection;

  before(async () => {
    toDispose = new DisposableCollection();
    container = await createContainer();
    await start(container, toDispose);
  });

  after(() => toDispose.dispose());

  describe('copy', () => {
    it('should copy a sketch when the destination does not exist', async function () {
      this.timeout(testTimeout);
      const sketchesService =
        container.get<SketchesServiceImpl>(SketchesService);
      const destinationPath = await sketchesService['createTempFolder']();
      let sketch = await sketchesService.createNewSketch();
      toDispose.push(disposeSketch(sketch));
      const sourcePath = FileUri.fsPath(sketch.uri);
      const libBasename = 'lib.cpp';
      const libContent = 'lib content';
      const libPath = join(sourcePath, libBasename);
      await fs.writeFile(libPath, libContent, { encoding: 'utf8' });
      const headerBasename = 'header.h';
      const headerContent = 'header content';
      const headerPath = join(sourcePath, headerBasename);
      await fs.writeFile(headerPath, headerContent, { encoding: 'utf8' });

      sketch = await sketchesService.loadSketch(sketch.uri);
      expect(Sketch.isInSketch(FileUri.create(libPath), sketch)).to.be.true;
      expect(Sketch.isInSketch(FileUri.create(headerPath), sketch)).to.be.true;

      const copied = await sketchesService.copy(sketch, {
        destinationUri: FileUri.create(destinationPath).toString(),
      });
      toDispose.push(disposeSketch(copied));
      expect(copied.name).to.be.equal(basename(destinationPath));
      expect(
        Sketch.isInSketch(
          FileUri.create(
            join(destinationPath, `${basename(destinationPath)}.ino`)
          ),
          copied
        )
      ).to.be.true;
      expect(
        Sketch.isInSketch(
          FileUri.create(join(destinationPath, libBasename)),
          copied
        )
      ).to.be.true;
      expect(
        Sketch.isInSketch(
          FileUri.create(join(destinationPath, headerBasename)),
          copied
        )
      ).to.be.true;
    });

    it("should copy only sketch files if 'onlySketchFiles' is true", async function () {
      this.timeout(testTimeout);
      const sketchesService =
        container.get<SketchesServiceImpl>(SketchesService);
      const destinationPath = await sketchesService['createTempFolder']();
      let sketch = await sketchesService.createNewSketch();
      toDispose.push(disposeSketch(sketch));
      const sourcePath = FileUri.fsPath(sketch.uri);
      const libBasename = 'lib.cpp';
      const libContent = 'lib content';
      const libPath = join(sourcePath, libBasename);
      await fs.writeFile(libPath, libContent, { encoding: 'utf8' });
      const headerBasename = 'header.h';
      const headerContent = 'header content';
      const headerPath = join(sourcePath, headerBasename);
      await fs.writeFile(headerPath, headerContent, { encoding: 'utf8' });
      const logBasename = 'inols-clangd-err.log';
      const logContent = 'log file content';
      const logPath = join(sourcePath, logBasename);
      await fs.writeFile(logPath, logContent, { encoding: 'utf8' });

      sketch = await sketchesService.loadSketch(sketch.uri);
      expect(Sketch.isInSketch(FileUri.create(libPath), sketch)).to.be.true;
      expect(Sketch.isInSketch(FileUri.create(headerPath), sketch)).to.be.true;
      expect(Sketch.isInSketch(FileUri.create(logPath), sketch)).to.be.false;
      const reloadedLogContent = await fs.readFile(logPath, {
        encoding: 'utf8',
      });
      expect(reloadedLogContent).to.be.equal(logContent);

      const copied = await sketchesService.copy(sketch, {
        destinationUri: FileUri.create(destinationPath).toString(),
        onlySketchFiles: true,
      });
      toDispose.push(disposeSketch(copied));
      expect(copied.name).to.be.equal(basename(destinationPath));
      expect(
        Sketch.isInSketch(
          FileUri.create(
            join(destinationPath, `${basename(destinationPath)}.ino`)
          ),
          copied
        )
      ).to.be.true;
      expect(
        Sketch.isInSketch(
          FileUri.create(join(destinationPath, libBasename)),
          copied
        )
      ).to.be.true;
      expect(
        Sketch.isInSketch(
          FileUri.create(join(destinationPath, headerBasename)),
          copied
        )
      ).to.be.true;
      expect(
        Sketch.isInSketch(
          FileUri.create(join(destinationPath, logBasename)),
          copied
        )
      ).to.be.false;
      try {
        await fs.readFile(join(destinationPath, logBasename), {
          encoding: 'utf8',
        });
        expect.fail(
          'Log file must not exist in the destination. Expected ENOENT when loading the log file.'
        );
      } catch (err) {
        expect(ErrnoException.isENOENT(err)).to.be.true;
      }
    });

    it('should copy sketch inside the sketch folder', async function () {
      this.timeout(testTimeout);
      const sketchesService =
        container.get<SketchesServiceImpl>(SketchesService);
      let sketch = await sketchesService.createNewSketch();
      const destinationPath = join(FileUri.fsPath(sketch.uri), 'nested_copy');
      toDispose.push(disposeSketch(sketch));
      const sourcePath = FileUri.fsPath(sketch.uri);
      const libBasename = 'lib.cpp';
      const libContent = 'lib content';
      const libPath = join(sourcePath, libBasename);
      await fs.writeFile(libPath, libContent, { encoding: 'utf8' });
      const headerBasename = 'header.h';
      const headerContent = 'header content';
      const headerPath = join(sourcePath, headerBasename);
      await fs.writeFile(headerPath, headerContent, { encoding: 'utf8' });

      sketch = await sketchesService.loadSketch(sketch.uri);
      expect(Sketch.isInSketch(FileUri.create(libPath), sketch)).to.be.true;
      expect(Sketch.isInSketch(FileUri.create(headerPath), sketch)).to.be.true;

      const copied = await sketchesService.copy(sketch, {
        destinationUri: FileUri.create(destinationPath).toString(),
      });
      toDispose.push(disposeSketch(copied));
      expect(copied.name).to.be.equal(basename(destinationPath));
      expect(
        Sketch.isInSketch(
          FileUri.create(
            join(destinationPath, `${basename(destinationPath)}.ino`)
          ),
          copied
        )
      ).to.be.true;
      expect(
        Sketch.isInSketch(
          FileUri.create(join(destinationPath, libBasename)),
          copied
        )
      ).to.be.true;
      expect(
        Sketch.isInSketch(
          FileUri.create(join(destinationPath, headerBasename)),
          copied
        )
      ).to.be.true;
    });

    it('should copy sketch with overwrite when source and destination sketch folder names are the same', async function () {
      this.timeout(testTimeout);
      const sketchesService =
        container.get<SketchesServiceImpl>(SketchesService);
      const sketchFolderName = 'alma';
      const contentOne = 'korte';
      const contentTwo = 'szilva';
      const [sketchOne, sketchTwo] = await Promise.all([
        sketchesService.createNewSketch(sketchFolderName, contentOne),
        sketchesService.createNewSketch(sketchFolderName, contentTwo),
      ]);
      toDispose.push(disposeSketch(sketchOne, sketchTwo));
      const [mainFileContentOne, mainFileContentTwo] = await Promise.all([
        mainFileContentOf(sketchOne),
        mainFileContentOf(sketchTwo),
      ]);
      expect(mainFileContentOne).to.be.equal(contentOne);
      expect(mainFileContentTwo).to.be.equal(contentTwo);

      await sketchesService.copy(sketchOne, { destinationUri: sketchTwo.uri });
      const [mainFileContentOneAfterCopy, mainFileContentTwoAfterCopy] =
        await Promise.all([
          mainFileContentOf(sketchOne),
          mainFileContentOf(sketchTwo),
        ]);
      expect(mainFileContentOneAfterCopy).to.be.equal(contentOne);
      expect(mainFileContentTwoAfterCopy).to.be.equal(contentOne);
    });
  });
});

function disposeSketch(...sketch: Sketch[]): Disposable {
  return new DisposableCollection(
    ...sketch
      .map(({ uri }) => FileUri.fsPath(uri))
      .map((path) =>
        Disposable.create(() => rimrafSync(path, { maxBusyTries: 5 }))
      )
  );
}

async function mainFileContentOf(sketch: Sketch): Promise<string> {
  return fs.readFile(FileUri.fsPath(sketch.mainFileUri), {
    encoding: 'utf8',
  });
}

async function start(
  container: Container,
  toDispose: DisposableCollection
): Promise<void> {
  await startDaemon(container, toDispose);
}

async function createContainer(): Promise<Container> {
  return createBaseContainer();
}
