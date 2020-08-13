import { inject, injectable, postConstruct } from 'inversify';
import { join, basename } from 'path';
import * as fs from './fs-extra';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { Sketch } from '../common/protocol/sketches-service';
import { SketchesServiceImpl } from './sketches-service-impl';
import { ExamplesService, ExampleContainer } from '../common/protocol/examples-service';

@injectable()
export class ExamplesServiceImpl implements ExamplesService {

    @inject(SketchesServiceImpl)
    protected readonly sketchesService: SketchesServiceImpl;

    protected _all: ExampleContainer | undefined;

    @postConstruct()
    protected init(): void {
        this.all();
    }

    async all(): Promise<ExampleContainer> {
        if (this._all) {
            return this._all;
        }
        this._all = await this.load();
        return this._all;
    }

    protected async load(path: string = join(__dirname, '..', '..', 'Examples')): Promise<ExampleContainer> {
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
