import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { join, basename } from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { notEmpty } from '@theia/core/lib/common/objects';
import {
  Sketch,
  SketchRef,
  SketchContainer,
} from '../common/protocol/sketches-service';
import { SketchesServiceImpl } from './sketches-service-impl';
import { ExamplesService } from '../common/protocol/examples-service';
import {
  LibraryLocation,
  LibraryPackage,
  LibraryService,
} from '../common/protocol';
import { ConfigServiceImpl } from './config-service-impl';
import { duration } from '../common/decorators';
import { URI } from '@theia/core/lib/common/uri';
import { Path } from '@theia/core/lib/common/path';
const eq = require('deep-equals');
import { diff } from 'deep-object-diff';
const deepSort = require('deep-sort-object');

@injectable()
export class ExamplesServiceImpl implements ExamplesService {
  @inject(SketchesServiceImpl)
  protected readonly sketchesService: SketchesServiceImpl;

  @inject(LibraryService)
  protected readonly libraryService: LibraryService;

  @inject(ConfigServiceImpl)
  protected readonly configService: ConfigServiceImpl;

  protected _all: SketchContainer[] | undefined;

  @postConstruct()
  protected init(): void {
    this.builtIns();
  }

  async builtIns(): Promise<SketchContainer[]> {
    if (this._all) {
      return this._all;
    }
    const exampleRootPath = join(__dirname, '..', '..', 'Examples');
    const exampleNames = await promisify(fs.readdir)(exampleRootPath);
    this._all = await Promise.all(
      exampleNames
        .map((name) => join(exampleRootPath, name))
        .map((path) => this.load(path))
    );
    return this._all;
  }

  // TODO: decide whether it makes sense to cache them. Keys should be: `fqbn` + version of containing core/library.
  async installed({ fqbn }: { fqbn?: string }): Promise<{
    user: SketchContainer[];
    current: SketchContainer[];
    any: SketchContainer[];
  }> {
    const [old, _new] = await Promise.all([
      this.installedOld({ fqbn }),
      this.installedNew({ fqbn }),
    ]);
    // Compare new and old
    if (eq(old, _new)) {
      console.log('---- happiness. the packages are the same');
    } else {
      console.error('---- yayy :( the packages are not the same');
      const diffObj = diff(old, _new);
      console.error(JSON.stringify(diffObj));
    }

    return old;
  }

  @duration()
  async installedOld({ fqbn }: { fqbn?: string }): Promise<{
    user: SketchContainer[];
    current: SketchContainer[];
    any: SketchContainer[];
  }> {
    const user: SketchContainer[] = [];
    const current: SketchContainer[] = [];
    const any: SketchContainer[] = [];
    const packages: LibraryPackage[] = await this.libraryService.list({
      fqbn,
    });
    for (const pkg of packages) {
      const container = await this.tryGroupExamplesOld(pkg);
      const { location } = pkg;
      if (location === LibraryLocation.USER) {
        user.push(container);
      } else if (
        location === LibraryLocation.PLATFORM_BUILTIN ||
        LibraryLocation.REFERENCED_PLATFORM_BUILTIN
      ) {
        current.push(container);
      } else {
        any.push(container);
      }
    }
    user.sort((left, right) => left.label.localeCompare(right.label));
    current.sort((left, right) => left.label.localeCompare(right.label));
    any.sort((left, right) => left.label.localeCompare(right.label));
    return deepSort({ user, current, any });
  }

  /**
   * The CLI provides direct FS paths to the examples so that menus and menu groups cannot be built for the UI by traversing the
   * folder hierarchy. This method tries to workaround it by falling back to the `installDirUri` and manually creating the
   * location of the examples. Otherwise it creates the example container from the direct examples FS paths.
   */
  protected async tryGroupExamplesOld({
    label,
    exampleUris,
    installDirUri,
  }: LibraryPackage): Promise<SketchContainer> {
    const paths = exampleUris.map((uri) => FileUri.fsPath(uri));
    if (installDirUri) {
      for (const example of [
        'example',
        'Example',
        'EXAMPLE',
        'examples',
        'Examples',
        'EXAMPLES',
      ]) {
        const examplesPath = join(FileUri.fsPath(installDirUri), example);
        const exists = await promisify(fs.exists)(examplesPath);
        const isDir =
          exists && (await promisify(fs.lstat)(examplesPath)).isDirectory();
        if (isDir) {
          const fileNames = await promisify(fs.readdir)(examplesPath);
          const children: SketchContainer[] = [];
          const sketches: SketchRef[] = [];
          for (const fileName of fileNames) {
            const subPath = join(examplesPath, fileName);
            const subIsDir = (await promisify(fs.lstat)(subPath)).isDirectory();
            if (subIsDir) {
              const sketch = await this.tryLoadSketch(subPath);
              if (!sketch) {
                const container = await this.load(subPath);
                if (container.children.length || container.sketches.length) {
                  children.push(container);
                  children.sort((left, right) =>
                    left.label.localeCompare(right.label)
                  );
                }
              } else {
                sketches.push({ name: sketch.name, uri: sketch.uri });
                sketches.sort((left, right) =>
                  left.name.localeCompare(right.name)
                );
              }
            }
          }
          return {
            label,
            children,
            sketches,
          };
        }
      }
    }
    const sketches = await Promise.all(
      paths.map((path) => this.tryLoadSketch(path))
    );
    return {
      label,
      children: [],
      sketches: sketches.filter(notEmpty),
    };
  }

  @duration()
  async installedNew({ fqbn }: { fqbn?: string }): Promise<{
    user: SketchContainer[];
    current: SketchContainer[];
    any: SketchContainer[];
  }> {
    const user: SketchContainer[] = [];
    const current: SketchContainer[] = [];
    const any: SketchContainer[] = [];
    const packages: LibraryPackage[] = await this.libraryService.list({
      fqbn,
    });
    for (const pkg of packages) {
      const container = await this.tryGroupExamplesNew(pkg);
      const { location } = pkg;
      if (location === LibraryLocation.USER) {
        user.push(container);
      } else if (
        location === LibraryLocation.PLATFORM_BUILTIN ||
        LibraryLocation.REFERENCED_PLATFORM_BUILTIN
      ) {
        current.push(container);
      } else {
        any.push(container);
      }
    }
    user.sort((left, right) => left.label.localeCompare(right.label));
    current.sort((left, right) => left.label.localeCompare(right.label));
    any.sort((left, right) => left.label.localeCompare(right.label));
    return deepSort({ user, current, any });
  }

  /**
   * The CLI provides direct FS paths to the examples so that menus and menu groups cannot be built for the UI by traversing the
   * folder hierarchy. This method tries to workaround it by falling back to the `installDirUri` and manually creating the
   * location of the examples. Otherwise it creates the example container from the direct examples FS paths.
   */
  protected async tryGroupExamplesNew({
    label,
    exampleUris,
    installDirUri,
  }: LibraryPackage): Promise<SketchContainer> {
    const container = SketchContainer.create(label);
    if (!installDirUri || !exampleUris.length) {
      return container;
    }
    // Args example:
    // exampleUris
    // 0:'file:///Users/a.kitta/Documents/Arduino/libraries/ATOM_DTU_CAT1/examples/MQTT'
    // 1:'file:///Users/a.kitta/Documents/Arduino/libraries/ATOM_DTU_CAT1/examples/Modbus/ModBus-RTU/Master'
    // 2:'file:///Users/a.kitta/Documents/Arduino/libraries/ATOM_DTU_CAT1/examples/Modbus/ModBus-RTU/Slave'
    // installDirUri
    // 'file:///Users/a.kitta/Documents/Arduino/libraries/ATOM_DTU_CAT1'
    // Expected menu structure:
    // ATOM_DTU_CAT1 > Modbus > ModBus-RTU > Master
    //               |                     > Slave
    //               > MQTT
    const logInfo = (ref: SketchRef) =>
      `Example URI: ${ref.uri}, install location URI: ${installDirUri}.`;
    for (const ref of exampleUris.map(SketchRef.fromUri)) {
      const path = new URI(installDirUri).relative(new URI(ref.uri));
      if (!path) {
        console.warn(
          `Could not resolve the sketch location from its install location. Skipping. ${logInfo(
            ref
          )}`
        );
        continue;
      }
      if (path.isAbsolute) {
        console.warn(
          `Expected a relative path between the sketch and the install locations. Skipping. Path was: ${path}. ${logInfo(
            ref
          )}`
        );
        continue;
      }
      const pathSegments = path.toString().split(Path.separator);
      if (pathSegments.length < 2) {
        console.warn(
          `Expected at least two segments long relative path. Skipping. Path segments were: ${pathSegments}. ${logInfo(
            ref
          )}`
        );
        continue;
      }
      // the relative must start start with `example` or `Examples` or `EXAMPLE`, .etc. It's open source.
      if (!/^examples?$/gi.test(pathSegments[0])) {
        console.warn(
          `First segment must start with "examples-like". More formally: \`/^examples?$/gi\`. Path segments were: ${pathSegments}. ${logInfo(
            ref
          )}`
        );
      }
      const getOrCreateChildContainer = (
        label: string,
        parent: SketchContainer
      ) => {
        let child = parent.children.find(
          ({ label: childLabel }) => childLabel === label
        );
        if (!child) {
          child = SketchContainer.create(label);
          parent.children.push(child);
          //TODO: remove or move sort
          parent.children.sort((left, right) =>
            left.label.localeCompare(right.label)
          );
        }
        return child;
      };
      const refContainer = pathSegments.reduce(
        (container, segment, index, segments) => {
          if (index === 0) {
            // skip the first "example-like" segment
            return container;
          }
          if (index === segments.length - 1) {
            // if last segment, it's the example sketch itself, do not create container for it.
            return container;
          }
          return getOrCreateChildContainer(segment, container);
        },
        container
      );
      refContainer.sketches.push(ref);
      //TODO: remove or move sort
      refContainer.sketches.sort((left, right) =>
        left.name.localeCompare(right.name)
      );
    }
    return container;
  }

  // Built-ins are included inside the IDE.
  protected async load(path: string): Promise<SketchContainer> {
    if (!(await promisify(fs.exists)(path))) {
      throw new Error('Examples are not available');
    }
    const stat = await promisify(fs.stat)(path);
    if (!stat.isDirectory) {
      throw new Error(`${path} is not a directory.`);
    }
    const names = await promisify(fs.readdir)(path);
    const sketches: SketchRef[] = [];
    const children: SketchContainer[] = [];
    for (const p of names.map((name) => join(path, name))) {
      const stat = await promisify(fs.stat)(p);
      if (stat.isDirectory()) {
        const sketch = await this.tryLoadSketch(p);
        if (sketch) {
          sketches.push({ name: sketch.name, uri: sketch.uri });
          sketches.sort((left, right) => left.name.localeCompare(right.name));
        } else {
          const child = await this.load(p);
          children.push(child);
          children.sort((left, right) => left.label.localeCompare(right.label));
        }
      }
    }
    const label = basename(path);
    return {
      label,
      children,
      sketches,
    };
  }

  protected async group(paths: string[]): Promise<Map<string, fs.Stats>> {
    const map = new Map<string, fs.Stats>();
    for (const path of paths) {
      const stat = await promisify(fs.stat)(path);
      map.set(path, stat);
    }
    return map;
  }

  protected async tryLoadSketch(path: string): Promise<Sketch | undefined> {
    try {
      const sketch = await this.sketchesService.loadSketch(
        FileUri.create(path).toString()
      );
      return sketch;
    } catch {
      return undefined;
    }
  }
}
