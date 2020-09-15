import { inject, injectable, postConstruct } from 'inversify';
import { join, basename } from 'path';
import * as fs from './fs-extra';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { notEmpty } from '@theia/core/lib/common/objects';
import { Sketch } from '../common/protocol/sketches-service';
import { SketchesServiceImpl } from './sketches-service-impl';
import { ExamplesService, ExampleContainer } from '../common/protocol/examples-service';
import { LibraryLocation, LibraryPackage, LibraryService } from '../common/protocol';
import { ConfigServiceImpl } from './config-service-impl';

@injectable()
export class ExamplesServiceImpl implements ExamplesService {

    @inject(SketchesServiceImpl)
    protected readonly sketchesService: SketchesServiceImpl;

    @inject(LibraryService)
    protected readonly libraryService: LibraryService;

    @inject(ConfigServiceImpl)
    protected readonly configService: ConfigServiceImpl;

    protected _all: ExampleContainer[] | undefined;

    @postConstruct()
    protected init(): void {
        this.builtIns();
    }

    async builtIns(): Promise<ExampleContainer[]> {
        if (this._all) {
            return this._all;
        }
        const exampleRootPath = join(__dirname, '..', '..', 'Examples');
        const exampleNames = await fs.readdir(exampleRootPath);
        this._all = await Promise.all(exampleNames.map(name => join(exampleRootPath, name)).map(path => this.load(path)));
        return this._all;
    }

    // TODO: decide whether it makes sense to cache them. Keys should be: `fqbn` + version of containing core/library.
    async installed({ fqbn }: { fqbn: string }): Promise<{ user: ExampleContainer[], current: ExampleContainer[], any: ExampleContainer[] }> {
        const user: ExampleContainer[] = [];
        const current: ExampleContainer[] = [];
        const any: ExampleContainer[] = [];
        if (fqbn) {
            const packages: LibraryPackage[] = await this.libraryService.list({ fqbn });
            for (const pkg of packages) {
                const container = await this.tryGroupExamples(pkg);
                const { location } = pkg;
                if (location === LibraryLocation.USER) {
                    user.push(container);
                } else if (location === LibraryLocation.PLATFORM_BUILTIN || LibraryLocation.REFERENCED_PLATFORM_BUILTIN) {
                    current.push(container);
                } else {
                    any.push(container);
                }
            }
        }
        return { user, current, any };
    }

    /**
     * The CLI provides direct FS paths to the examples so that menus and menu groups cannot be built for the UI by traversing the
     * folder hierarchy. This method tries to workaround it by falling back to the `installDirUri` and manually creating the
     * location of the examples. Otherwise it creates the example container from the direct examples FS paths.
     */
    protected async tryGroupExamples({ label, exampleUris, installDirUri }: LibraryPackage): Promise<ExampleContainer> {
        const paths = exampleUris.map(uri => FileUri.fsPath(uri));
        if (installDirUri) {
            for (const example of ['example', 'Example', 'EXAMPLE', 'examples', 'Examples', 'EXAMPLES']) {
                const examplesPath = join(FileUri.fsPath(installDirUri), example);
                const exists = await fs.exists(examplesPath);
                const isDir = exists && (await fs.lstat(examplesPath)).isDirectory();
                if (isDir) {
                    const fileNames = await fs.readdir(examplesPath);
                    const children: ExampleContainer[] = [];
                    const sketches: Sketch[] = [];
                    for (const fileName of fileNames) {
                        const subPath = join(examplesPath, fileName);
                        const subIsDir = (await fs.lstat(subPath)).isDirectory();
                        if (subIsDir) {
                            const sketch = await this.tryLoadSketch(subPath);
                            if (!sketch) {
                                const container = await this.load(subPath);
                                if (container.children.length || container.sketches.length) {
                                    children.push(container);
                                }
                            } else {
                                sketches.push(sketch);
                            }
                        }
                    }
                    return {
                        label,
                        children,
                        sketches
                    };
                }
            }
        }
        const sketches = await Promise.all(paths.map(path => this.tryLoadSketch(path)));
        return {
            label,
            children: [],
            sketches: sketches.filter(notEmpty)
        };
    }

    // Built-ins are included inside the IDE.
    protected async load(path: string): Promise<ExampleContainer> {
        if (!await fs.exists(path)) {
            throw new Error('Examples are not available');
        }
        const stat = await fs.stat(path);
        if (!stat.isDirectory) {
            throw new Error(`${path} is not a directory.`);
        }
        const names = await fs.readdir(path);
        const sketches: Sketch[] = [];
        const children: ExampleContainer[] = [];
        for (const p of names.map(name => join(path, name))) {
            const stat = await fs.stat(p);
            if (stat.isDirectory()) {
                const sketch = await this.tryLoadSketch(p);
                if (sketch) {
                    sketches.push(sketch);
                } else {
                    const child = await this.load(p);
                    children.push(child);
                }
            }
        }
        const label = basename(path);
        return {
            label,
            children,
            sketches
        };
    }

    protected async group(paths: string[]): Promise<Map<string, fs.Stats>> {
        const map = new Map<string, fs.Stats>();
        for (const path of paths) {
            const stat = await fs.stat(path);
            map.set(path, stat);
        }
        return map;
    }

    protected async tryLoadSketch(path: string): Promise<Sketch | undefined> {
        try {
            const sketch = await this.sketchesService.loadSketch(FileUri.create(path).toString());
            return sketch;
        } catch {
            return undefined;
        }
    }

}
