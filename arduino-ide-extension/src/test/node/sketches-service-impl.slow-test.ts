import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { isWindows } from '@theia/core/lib/common/os';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { rejects } from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { basename, join } from 'node:path';
import { sync as rimrafSync } from 'rimraf';
import temp from 'temp';
import { Sketch, SketchesService } from '../../common/protocol';
import {
  isAccessibleSketchPath,
  SketchesServiceImpl,
} from '../../node/sketches-service-impl';
import { ErrnoException } from '../../node/utils/errors';
import { createBaseContainer, startDaemon } from './node-test-bindings';

const testTimeout = 10_000;

describe('isAccessibleSketchPath', () => {
  let tracked: typeof temp;
  let testDirPath: string;

  before(() => (tracked = temp.track()));
  beforeEach(() => (testDirPath = tracked.mkdirSync()));
  after(() => tracked.cleanupSync());

  it('should be accessible by the main sketch file', async () => {
    const sketchFolderPath = join(testDirPath, 'my_sketch');
    const mainSketchFilePath = join(sketchFolderPath, 'my_sketch.ino');
    await fs.mkdir(sketchFolderPath, { recursive: true });
    await fs.writeFile(mainSketchFilePath, '', { encoding: 'utf8' });
    const actual = await isAccessibleSketchPath(mainSketchFilePath);
    expect(actual).to.be.equal(mainSketchFilePath);
  });

  it('should be accessible by the sketch folder', async () => {
    const sketchFolderPath = join(testDirPath, 'my_sketch');
    const mainSketchFilePath = join(sketchFolderPath, 'my_sketch.ino');
    await fs.mkdir(sketchFolderPath, { recursive: true });
    await fs.writeFile(mainSketchFilePath, '', { encoding: 'utf8' });
    const actual = await isAccessibleSketchPath(sketchFolderPath);
    expect(actual).to.be.equal(mainSketchFilePath);
  });

  it('should be accessible when the sketch folder and main sketch file basenames are different', async () => {
    const sketchFolderPath = join(testDirPath, 'my_sketch');
    const mainSketchFilePath = join(sketchFolderPath, 'other_name_sketch.ino');
    await fs.mkdir(sketchFolderPath, { recursive: true });
    await fs.writeFile(mainSketchFilePath, '', { encoding: 'utf8' });
    const actual = await isAccessibleSketchPath(sketchFolderPath);
    expect(actual).to.be.equal(mainSketchFilePath);
  });

  it('should be deterministic (and sort by basename) when multiple sketch files exist', async () => {
    const sketchFolderPath = join(testDirPath, 'my_sketch');
    const aSketchFilePath = join(sketchFolderPath, 'a.ino');
    const bSketchFilePath = join(sketchFolderPath, 'b.ino');
    await fs.mkdir(sketchFolderPath, { recursive: true });
    await fs.writeFile(aSketchFilePath, '', { encoding: 'utf8' });
    await fs.writeFile(bSketchFilePath, '', { encoding: 'utf8' });
    const actual = await isAccessibleSketchPath(sketchFolderPath);
    expect(actual).to.be.equal(aSketchFilePath);
  });

  it('should ignore EACCESS (non-Windows)', async function () {
    if (isWindows) {
      // `stat` syscall does not result in an EACCESS on Windows after stripping the file permissions.
      // an `open` syscall would, but IDE2 on purpose does not check the files.
      // the sketch files are provided by the CLI after loading the sketch.
      return this.skip();
    }
    const sketchFolderPath = join(testDirPath, 'my_sketch');
    const mainSketchFilePath = join(sketchFolderPath, 'my_sketch.ino');
    await fs.mkdir(sketchFolderPath, { recursive: true });
    await fs.writeFile(mainSketchFilePath, '', { encoding: 'utf8' });
    await fs.chmod(mainSketchFilePath, 0o000); // remove all permissions
    await rejects(fs.readFile(mainSketchFilePath), ErrnoException.isEACCES);
    const actual = await isAccessibleSketchPath(sketchFolderPath);
    expect(actual).to.be.equal(mainSketchFilePath);
  });

  it("should not be accessible when there are no '.ino' files in the folder", async () => {
    const sketchFolderPath = join(testDirPath, 'my_sketch');
    await fs.mkdir(sketchFolderPath, { recursive: true });
    const actual = await isAccessibleSketchPath(sketchFolderPath);
    expect(actual).to.be.undefined;
  });

  it("should not be accessible when the main sketch file extension is not '.ino'", async () => {
    const sketchFolderPath = join(testDirPath, 'my_sketch');
    const mainSketchFilePath = join(sketchFolderPath, 'my_sketch.cpp');
    await fs.mkdir(sketchFolderPath, { recursive: true });
    await fs.writeFile(mainSketchFilePath, '', { encoding: 'utf8' });
    const actual = await isAccessibleSketchPath(sketchFolderPath);
    expect(actual).to.be.undefined;
  });

  it('should handle ENOENT', async () => {
    const sketchFolderPath = join(testDirPath, 'my_sketch');
    const actual = await isAccessibleSketchPath(sketchFolderPath);
    expect(actual).to.be.undefined;
  });

  it('should handle UNKNOWN (Windows)', async function () {
    if (!isWindows) {
      return this.skip();
    }
    this.timeout(60_000);
    const actual = await isAccessibleSketchPath('\\\\10.0.0.200\\path');
    expect(actual).to.be.undefined;
  });
});

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

    (
      [
        ['(', ')', 'parentheses'],
        ['[', ']', 'brackets'],
        ['{', '}', 'braces'],
        [
          '<',
          '>',
          'chevrons',
          {
            predicate: () => isWindows,
            why: '< (less than) and > (greater than) are reserved characters on Windows (https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#naming-conventions)',
          },
        ],
      ] as [
        open: string,
        close: string,
        name: string,
        skip?: { predicate: () => boolean; why: string }
      ][]
    ).map(([open, close, name, skip]) =>
      it(`should copy a sketch when the path contains ${name} in the sketch folder path: '${open},${close}'`, async function () {
        if (skip) {
          const { predicate, why } = skip;
          if (predicate()) {
            console.info(why);
            return this.skip();
          }
        }
        this.timeout(testTimeout);
        const sketchesService =
          container.get<SketchesServiceImpl>(SketchesService);
        const content = `// special content when ${name} are in the path`;
        const tempRoot = await sketchesService['createTempFolder']();
        toDispose.push(disposeFolder(tempRoot));
        const sketch = await sketchesService.createNewSketch(
          'punctuation_marks',
          content
        );
        toDispose.push(disposeSketch(sketch));

        // the destination path contains punctuation marks
        const tempRootUri = FileUri.create(tempRoot);
        const testSegment = `path segment with ${open}${name}${close}`;
        const firstDestinationUri = tempRootUri
          .resolve(testSegment)
          .resolve('first')
          .resolve(sketch.name);

        const firstSketchCopy = await sketchesService.copy(sketch, {
          destinationUri: firstDestinationUri.toString(),
        });
        expect(firstSketchCopy).to.be.not.undefined;
        expect(firstSketchCopy.mainFileUri).to.be.equal(
          firstDestinationUri.resolve(`${sketch.name}.ino`).toString()
        );
        const firstCopyContent = await mainFileContentOf(firstSketchCopy);
        expect(firstCopyContent).to.be.equal(content);

        // the source path contains punctuation marks. yes, the target too, but it does not matter
        const secondDestinationUri = tempRootUri
          .resolve(testSegment)
          .resolve('second')
          .resolve(sketch.name);
        const secondSketchCopy = await sketchesService.copy(firstSketchCopy, {
          destinationUri: secondDestinationUri.toString(),
        });
        expect(secondSketchCopy).to.be.not.undefined;
        expect(secondSketchCopy.mainFileUri).to.be.equal(
          secondDestinationUri.resolve(`${sketch.name}.ino`).toString()
        );
        const secondCopyContent = await mainFileContentOf(secondSketchCopy);
        expect(secondCopyContent).to.be.equal(content);
      })
    );
  });
});

function disposeSketch(...sketch: Sketch[]): Disposable {
  return disposeFolder(...sketch.map(({ uri }) => FileUri.fsPath(uri)));
}

function disposeFolder(...paths: string[]): Disposable {
  return new DisposableCollection(
    ...paths.map((path) =>
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
