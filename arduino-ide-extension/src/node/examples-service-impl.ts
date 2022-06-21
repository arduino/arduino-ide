import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { join } from 'path';
import * as fs from 'fs';
import { FileUri } from '@theia/core/lib/node/file-uri';
import {
  SketchRef,
  SketchContainer,
} from '../common/protocol/sketches-service';
import { ExamplesService } from '../common/protocol/examples-service';
import {
  LibraryLocation,
  LibraryPackage,
  LibraryService,
} from '../common/protocol';
import { duration } from '../common/decorators';
import { URI } from '@theia/core/lib/common/uri';
import { Path } from '@theia/core/lib/common/path';

interface BuiltInSketchRef {
  readonly name: string;
  readonly relativePath: string;
}
namespace BuiltInSketchRef {
  export function toSketchRef(
    { name, relativePath }: BuiltInSketchRef,
    root: URI
  ): SketchRef {
    return {
      name,
      uri: root.resolve(relativePath).toString(),
    };
  }
}
interface BuiltInSketchContainer {
  readonly label: string;
  readonly children: BuiltInSketchContainer[];
  readonly sketches: BuiltInSketchRef[];
}
namespace BuiltInSketchContainer {
  export function toSketchContainer(
    source: BuiltInSketchContainer,
    root: URI
  ): SketchContainer {
    return {
      label: source.label,
      children: source.children.map((child) => toSketchContainer(child, root)),
      sketches: source.sketches.map((child) =>
        BuiltInSketchRef.toSketchRef(child, root)
      ),
    };
  }
}

@injectable()
export class BuiltInExamplesServiceImpl {
  protected _builtIns: SketchContainer[] | undefined;

  @postConstruct()
  protected init(): void {
    this.builtIns();
  }

  async builtIns(): Promise<SketchContainer[]> {
    if (this._builtIns) {
      return this._builtIns;
    }
    const examplesRootPath = join(__dirname, '..', '..', 'Examples');
    const examplesRootUri = FileUri.create(examplesRootPath);
    const rawJson = await fs.promises.readFile(
      join(examplesRootPath, 'examples.json'),
      { encoding: 'utf8' }
    );
    const examples: BuiltInSketchContainer[] = JSON.parse(rawJson);
    this._builtIns = examples.map((container) =>
      BuiltInSketchContainer.toSketchContainer(container, examplesRootUri)
    );
    return this._builtIns;
  }
}

@injectable()
export class ExamplesServiceImpl implements ExamplesService {
  @inject(LibraryService)
  private readonly libraryService: LibraryService;

  @inject(BuiltInExamplesServiceImpl)
  private readonly builtInExamplesService: BuiltInExamplesServiceImpl;

  builtIns(): Promise<SketchContainer[]> {
    return this.builtInExamplesService.builtIns();
  }

  @duration()
  async installed({ fqbn }: { fqbn?: string }): Promise<{
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
      const container = await this.tryGroupExamples(pkg);
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
    return { user, current, any };
  }

  /**
   * The CLI provides direct FS paths to the examples so that menus and menu groups cannot be built for the UI by traversing the
   * folder hierarchy. This method tries to workaround it by falling back to the `installDirUri` and manually creating the
   * location of the examples. Otherwise it creates the example container from the direct examples FS paths.
   */
  private async tryGroupExamples({
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
    }
    return container;
  }
}
