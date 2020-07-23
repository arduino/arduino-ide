import { injectable, inject } from 'inversify';
import * as os from 'os';
import * as temp from 'temp';
import * as path from 'path';
import * as fs from './fs-extra';
import { ncp } from 'ncp';
import { FileUri, BackendApplicationContribution } from '@theia/core/lib/node';
import { ConfigService } from '../common/protocol/config-service';
import { SketchesService, Sketch } from '../common/protocol/sketches-service';
import URI from '@theia/core/lib/common/uri';

export const ALLOWED_FILE_EXTENSIONS = ['.c', '.cpp', '.h', '.hh', '.hpp', '.s', '.pde', '.ino'];

// TODO: `fs`: use async API 
@injectable()
export class SketchesServiceImpl implements SketchesService, BackendApplicationContribution {

    protected readonly temp = temp.track();

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    onStop(): void {
        this.temp.cleanupSync();
    }

    async getSketches(uri?: string): Promise<Sketch[]> {
        const sketches: Array<Sketch & { mtimeMs: number }> = [];
        let fsPath: undefined | string;
        if (!uri) {
            const { sketchDirUri } = await this.configService.getConfiguration();
            fsPath = FileUri.fsPath(sketchDirUri);
            if (!fs.existsSync(fsPath)) {
                await fs.mkdirp(fsPath);
            }
        } else {
            fsPath = FileUri.fsPath(uri);
        }
        if (!fs.existsSync(fsPath)) {
            return [];
        }
        const fileNames = await fs.readdir(fsPath);
        for (const fileName of fileNames) {
            const filePath = path.join(fsPath, fileName);
            if (await this.isSketchFolder(FileUri.create(filePath).toString())) {
                const stat = await fs.stat(filePath);
                sketches.push({
                    mtimeMs: stat.mtimeMs,
                    name: fileName,
                    uri: FileUri.create(filePath).toString()
                });
            }
        }
        return sketches.sort((left, right) => right.mtimeMs - left.mtimeMs);
    }

    /**
     * Return all allowed files.
     * File extensions: 'c', 'cpp', 'h', 'hh', 'hpp', 's', 'pde', 'ino'
     */
    async getSketchFiles(uri: string): Promise<string[]> {
        const uris: string[] = [];
        const fsPath = FileUri.fsPath(uri);
        if (fs.lstatSync(fsPath).isDirectory()) {
            if (await this.isSketchFolder(uri)) {
                const basename = path.basename(fsPath)
                const fileNames = await fs.readdir(fsPath);
                for (const fileName of fileNames) {
                    const filePath = path.join(fsPath, fileName);
                    if (ALLOWED_FILE_EXTENSIONS.indexOf(path.extname(filePath)) !== -1
                        && fs.existsSync(filePath)
                        && fs.lstatSync(filePath).isFile()) {
                        const uri = FileUri.create(filePath).toString();
                        if (fileName === basename + '.ino') {
                            uris.unshift(uri); // The sketch file is the first.
                        } else {
                            uris.push(uri);
                        }
                    }
                }
            }
            return uris;
        }
        const sketchDir = path.dirname(fsPath);
        return this.getSketchFiles(FileUri.create(sketchDir).toString());
    }

    async createNewSketch(): Promise<Sketch> {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const today = new Date();
        const parent = await new Promise<string>((resolve, reject) => {
            this.temp.mkdir({ prefix: '.arduinoProIDE' }, (err, dirPath) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(dirPath);
            })
        })
        const sketchBaseName = `sketch_${monthNames[today.getMonth()]}${today.getDate()}`;
        const config = await this.configService.getConfiguration();
        const user = FileUri.fsPath(config.sketchDirUri);
        let sketchName: string | undefined;
        for (let i = 97; i < 97 + 26; i++) {
            let sketchNameCandidate = `${sketchBaseName}${String.fromCharCode(i)}`;
            // Note: we check the future destination folder (`directories.user`) for name collision and not the temp folder!
            if (fs.existsSync(path.join(user, sketchNameCandidate))) {
                continue;
            }

            sketchName = sketchNameCandidate;
            break;
        }

        if (!sketchName) {
            throw new Error('Cannot create a unique sketch name');
        }

        const sketchDir = path.join(parent, sketchName)
        const sketchFile = path.join(sketchDir, `${sketchName}.ino`);
        await fs.mkdirp(sketchDir);
        await fs.writeFile(sketchFile, `void setup() {
  // put your setup code here, to run once:

}

void loop() {
  // put your main code here, to run repeatedly:

}
`, { encoding: 'utf8' });
        return {
            name: sketchName,
            uri: FileUri.create(sketchDir).toString()
        }
    }

    async getSketchFolder(uri: string): Promise<Sketch | undefined> {
        if (!uri) {
            return undefined;
        }
        let currentUri = new URI(uri);
        while (currentUri && !currentUri.path.isRoot) {
            if (await this.isSketchFolder(currentUri.toString())) {
                return {
                    name: currentUri.path.base,
                    uri: currentUri.toString()
                };
            }
            currentUri = currentUri.parent;
        }
        return undefined;
    }

    async isSketchFolder(uri: string): Promise<boolean> {
        const fsPath = FileUri.fsPath(uri);
        if (fs.existsSync(fsPath) && fs.lstatSync(fsPath).isDirectory()) {
            const basename = path.basename(fsPath);
            const files = await fs.readdir(fsPath);
            for (let i = 0; i < files.length; i++) {
                if (files[i] === basename + '.ino') {
                    return true;
                }
            }
        }
        return false;
    }

    async isTemp(sketch: Sketch): Promise<boolean> {
        const sketchPath = FileUri.fsPath(sketch.uri);
        return sketchPath.indexOf('.arduinoProIDE') !== -1 && sketchPath.startsWith(os.tmpdir());
    }

    async copy(sketch: Sketch, { destinationUri }: { destinationUri: string }): Promise<string> {
        const source = FileUri.fsPath(sketch.uri);
        if (await !fs.exists(source)) {
            throw new Error(`Sketch does not exist: ${sketch}`);
        }
        const destination = FileUri.fsPath(destinationUri);
        await new Promise<void>((resolve, reject) => {
            ncp.ncp(source, destination, error => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
        return FileUri.create(destination).toString();
    }

}
