import { injectable, inject } from 'inversify';
import * as fs from 'fs';
import * as os from 'os';
import * as temp from 'temp';
import * as path from 'path';
import { ncp } from 'ncp';
import { Stats } from 'fs';
import { promisify } from 'util';
import URI from '@theia/core/lib/common/uri';
import { FileUri } from '@theia/core/lib/node';
import { isWindows } from '@theia/core/lib/common/os';
import { ConfigService } from '../common/protocol/config-service';
import { SketchesService, Sketch } from '../common/protocol/sketches-service';
import { firstToLowerCase } from '../common/utils';
import { NotificationServiceServerImpl } from './notification-service-server';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';

// As currently implemented on Linux,
// the maximum number of symbolic links that will be followed while resolving a pathname is 40
const MAX_FILESYSTEM_DEPTH = 40;

const WIN32_DRIVE_REGEXP = /^[a-zA-Z]:\\/;

const prefix = '.arduinoProIDE-unsaved';

// TODO: `fs`: use async API 
@injectable()
export class SketchesServiceImpl implements SketchesService {

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    @inject(NotificationServiceServerImpl)
    protected readonly notificationService: NotificationServiceServerImpl;

    @inject(EnvVariablesServer)
    protected readonly envVariableServer: EnvVariablesServer;

    async getSketches(uri?: string): Promise<SketchWithDetails[]> {
        let sketchbookPath: undefined | string;
        if (!uri) {
            const { sketchDirUri } = await this.configService.getConfiguration();
            sketchbookPath = FileUri.fsPath(sketchDirUri);
            if (!await promisify(fs.exists)(sketchbookPath)) {
                await promisify(fs.mkdir)(sketchbookPath, { recursive: true });
            }
        } else {
            sketchbookPath = FileUri.fsPath(uri);
        }
        if (!await promisify(fs.exists)(sketchbookPath)) {
            return [];
        }
        const stat = await promisify(fs.stat)(sketchbookPath);
        if (!stat.isDirectory()) {
            return [];
        }

        const sketches: Array<SketchWithDetails> = [];
        const filenames = await promisify(fs.readdir)(sketchbookPath);
        for (const fileName of filenames) {
            const filePath = path.join(sketchbookPath, fileName);
            if (await this.isSketchFolder(FileUri.create(filePath).toString())) {
                try {
                    const stat = await promisify(fs.stat)(filePath);
                    const sketch = await this.loadSketch(FileUri.create(filePath).toString());
                    sketches.push({
                        ...sketch,
                        mtimeMs: stat.mtimeMs
                    });
                } catch {
                    console.warn(`Could not load sketch from ${filePath}.`);
                }
            }
        }
        sketches.sort((left, right) => right.mtimeMs - left.mtimeMs);
        return sketches;
    }

    /**
     * This is the TS implementation of `SketchLoad` from the CLI.
     * See: https://github.com/arduino/arduino-cli/issues/837
     * Based on: https://github.com/arduino/arduino-cli/blob/eef3705c4afcba4317ec38b803d9ffce5dd59a28/arduino/builder/sketch.go#L100-L215
     */
    async loadSketch(uri: string): Promise<SketchWithDetails> {
        const sketchPath = FileUri.fsPath(uri);
        const exists = await promisify(fs.exists)(sketchPath);
        if (!exists) {
            throw new Error(`${uri} does not exist.`);
        }
        const stat = await promisify(fs.lstat)(sketchPath);
        let sketchFolder: string | undefined;
        let mainSketchFile: string | undefined;

        // If a sketch folder was passed, save the parent and point sketchPath to the main sketch file
        if (stat.isDirectory()) {
            sketchFolder = sketchPath;
            // Allowed extensions are .ino and .pde (but not both)
            for (const extension of Sketch.Extensions.MAIN) {
                const candidateSketchFile = path.join(sketchPath, `${path.basename(sketchPath)}${extension}`);
                const candidateExists = await promisify(fs.exists)(candidateSketchFile);
                if (candidateExists) {
                    if (!mainSketchFile) {
                        mainSketchFile = candidateSketchFile;
                    } else {
                        throw new Error(`Multiple main sketch files found (${path.basename(mainSketchFile)}, ${path.basename(candidateSketchFile)})`);
                    }
                }
            }

            // Check main file was found.
            if (!mainSketchFile) {
                throw new Error(`Unable to find a sketch file in directory ${sketchFolder}`);
            }

            // Check main file is readable.
            try {
                await promisify(fs.access)(mainSketchFile, fs.constants.R_OK);
            } catch {
                throw new Error('Unable to open the main sketch file.');
            }

            const mainSketchFileStat = await promisify(fs.lstat)(mainSketchFile);
            if (mainSketchFileStat.isDirectory()) {
                throw new Error(`Sketch must not be a directory.`);
            }
        } else {
            sketchFolder = path.dirname(sketchPath);
            mainSketchFile = sketchPath;
        }

        const files: string[] = [];
        let rootVisited = false;
        const err = await this.simpleLocalWalk(sketchFolder, MAX_FILESYSTEM_DEPTH, async (fsPath: string, info: Stats, error: Error | undefined) => {
            if (error) {
                console.log(`Error during sketch processing: ${error}`);
                return error;
            }
            const name = path.basename(fsPath);
            if (info.isDirectory()) {
                if (rootVisited) {
                    if (name.startsWith('.') || name === 'CVS' || name === 'RCS') {
                        return new SkipDir();
                    }
                } else {
                    rootVisited = true
                }
                return undefined;
            }

            if (name.startsWith('.')) {
                return undefined;
            }
            const ext = path.extname(fsPath);
            const isMain = Sketch.Extensions.MAIN.indexOf(ext) !== -1;
            const isAdditional = Sketch.Extensions.ADDITIONAL.indexOf(ext) !== -1;
            if (!isMain && !isAdditional) {
                return undefined;
            }

            try {
                await promisify(fs.access)(fsPath, fs.constants.R_OK);
                files.push(fsPath);
            } catch { }

            return undefined;
        });

        if (err) {
            console.error(`There was an error while collecting the sketch files: ${sketchPath}`)
            throw err;
        }

        return this.newSketch(sketchFolder, mainSketchFile, files);

    }

    private get recentSketchesFsPath(): Promise<string> {
        return this.envVariableServer.getConfigDirUri().then(uri => path.join(FileUri.fsPath(uri), 'recent-sketches.json'));
    }

    private async loadRecentSketches(fsPath: string): Promise<Record<string, number>> {
        let data: Record<string, number> = {};
        try {
            const raw = await promisify(fs.readFile)(fsPath, { encoding: 'utf8' });
            data = JSON.parse(raw);
        } catch { }
        return data;
    }

    async markAsRecentlyOpened(uri: string): Promise<void> {
        let sketch: Sketch | undefined = undefined;
        try {
            sketch = await this.loadSketch(uri);
        } catch {
            return;
        }
        if (await this.isTemp(sketch)) {
            return;
        }

        const fsPath = await this.recentSketchesFsPath;
        const data = await this.loadRecentSketches(fsPath);
        const now = Date.now();
        data[sketch.uri] = now;

        let toDeleteUri: string | undefined = undefined;
        if (Object.keys(data).length > 10) {
            let min = Number.MAX_SAFE_INTEGER;
            for (const uri of Object.keys(data)) {
                if (min > data[uri]) {
                    min = data[uri];
                    toDeleteUri = uri;
                }
            }
        }

        if (toDeleteUri) {
            delete data[toDeleteUri];
        }

        await promisify(fs.writeFile)(fsPath, JSON.stringify(data, null, 2));
        this.recentlyOpenedSketches().then(sketches => this.notificationService.notifyRecentSketchesChanged({ sketches }));
    }

    async recentlyOpenedSketches(): Promise<Sketch[]> {
        const configDirUri = await this.envVariableServer.getConfigDirUri();
        const fsPath = path.join(FileUri.fsPath(configDirUri), 'recent-sketches.json');
        let data: Record<string, number> = {};
        try {
            const raw = await promisify(fs.readFile)(fsPath, { encoding: 'utf8' });
            data = JSON.parse(raw);
        } catch { }

        const sketches: SketchWithDetails[] = []
        for (const uri of Object.keys(data).sort((left, right) => data[right] - data[left])) {
            try {
                const sketch = await this.loadSketch(uri);
                sketches.push(sketch);
            } catch { }
        }

        return sketches;
    }

    private async newSketch(sketchFolderPath: string, mainFilePath: string, allFilesPaths: string[]): Promise<SketchWithDetails> {
        let mainFile: string | undefined;
        const paths = new Set<string>();
        for (const p of allFilesPaths) {
            if (p === mainFilePath) {
                mainFile = p;
            } else {
                paths.add(p);
            }
        }
        if (!mainFile) {
            throw new Error('Could not locate main sketch file.');
        }
        const additionalFiles: string[] = [];
        const otherSketchFiles: string[] = [];
        for (const p of Array.from(paths)) {
            const ext = path.extname(p);
            if (Sketch.Extensions.MAIN.indexOf(ext) !== -1) {
                if (path.dirname(p) === sketchFolderPath) {
                    otherSketchFiles.push(p);
                }
            } else if (Sketch.Extensions.ADDITIONAL.indexOf(ext) !== -1) {
                // XXX: this is a caveat with the CLI, we do not know the `buildPath`.
                // https://github.com/arduino/arduino-cli/blob/0483882b4f370c288d5318913657bbaa0325f534/arduino/sketch/sketch.go#L108-L110
                additionalFiles.push(p);
            } else {
                throw new Error(`Unknown sketch file extension '${ext}'.`);
            }
        }
        additionalFiles.sort();
        otherSketchFiles.sort();

        const { mtimeMs } = await promisify(fs.lstat)(sketchFolderPath);
        return {
            uri: FileUri.create(sketchFolderPath).toString(),
            mainFileUri: FileUri.create(mainFile).toString(),
            name: path.basename(sketchFolderPath),
            additionalFileUris: additionalFiles.map(p => FileUri.create(p).toString()),
            otherSketchFileUris: otherSketchFiles.map(p => FileUri.create(p).toString()),
            mtimeMs
        };
    }

    async cloneExample(uri: string): Promise<Sketch> {
        const sketch = await this.loadSketch(uri);
        const parentPath = await new Promise<string>((resolve, reject) => {
            temp.mkdir({ prefix }, (err, dirPath) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(dirPath);
            })
        });
        const destinationUri = FileUri.create(path.join(parentPath, sketch.name)).toString();
        const copiedSketchUri = await this.copy(sketch, { destinationUri });
        return this.loadSketch(copiedSketchUri);
    }

    protected async simpleLocalWalk(
        root: string,
        maxDepth: number,
        walk: (fsPath: string, info: Stats | undefined, err: Error | undefined) => Promise<Error | undefined>): Promise<Error | undefined> {

        let { info, err } = await this.lstat(root);
        if (err) {
            return walk(root, undefined, err);
        }
        if (!info) {
            return new Error(`Could not stat file: ${root}.`);
        }
        err = await walk(root, info, err);
        if (err instanceof SkipDir) {
            return undefined;
        }

        if (info.isDirectory()) {
            if (maxDepth <= 0) {
                return walk(root, info, new Error(`Filesystem bottom is too deep (directory recursion or filesystem really deep): ${root}`));
            }
            maxDepth--;
            const files: string[] = [];
            try {
                files.push(...await promisify(fs.readdir)(root));
            } catch { }
            for (const file of files) {
                err = await this.simpleLocalWalk(path.join(root, file), maxDepth, walk);
                if (err instanceof SkipDir) {
                    return undefined;
                }
            }
        }

        return undefined;
    }

    private async lstat(fsPath: string): Promise<{ info: Stats, err: undefined } | { info: undefined, err: Error }> {
        const exists = await promisify(fs.exists)(fsPath);
        if (!exists) {
            return { info: undefined, err: new Error(`${fsPath} does not exist`) };
        }
        try {
            const info = await promisify(fs.lstat)(fsPath);
            return { info, err: undefined };
        } catch (err) {
            return { info: undefined, err };
        }
    }

    async createNewSketch(): Promise<Sketch> {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const today = new Date();
        const parentPath = await new Promise<string>((resolve, reject) => {
            temp.mkdir({ prefix }, (err, dirPath) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(dirPath);
            });
        });
        const sketchBaseName = `sketch_${monthNames[today.getMonth()]}${today.getDate()}`;
        const config = await this.configService.getConfiguration();
        const user = FileUri.fsPath(config.sketchDirUri);
        let sketchName: string | undefined;
        for (let i = 97; i < 97 + 26; i++) {
            let sketchNameCandidate = `${sketchBaseName}${String.fromCharCode(i)}`;
            // Note: we check the future destination folder (`directories.user`) for name collision and not the temp folder!
            if (await promisify(fs.exists)(path.join(user, sketchNameCandidate))) {
                continue;
            }

            sketchName = sketchNameCandidate;
            break;
        }

        if (!sketchName) {
            throw new Error('Cannot create a unique sketch name');
        }

        const sketchDir = path.join(parentPath, sketchName)
        const sketchFile = path.join(sketchDir, `${sketchName}.ino`);
        await promisify(fs.mkdir)(sketchDir, { recursive: true });
        await promisify(fs.writeFile)(sketchFile, `void setup() {
  // put your setup code here, to run once:

}

void loop() {
  // put your main code here, to run repeatedly:

}
`, { encoding: 'utf8' });
        return this.loadSketch(FileUri.create(sketchDir).toString());
    }

    async getSketchFolder(uri: string): Promise<Sketch | undefined> {
        if (!uri) {
            return undefined;
        }
        let currentUri = new URI(uri);
        while (currentUri && !currentUri.path.isRoot) {
            if (await this.isSketchFolder(currentUri.toString())) {
                return this.loadSketch(currentUri.toString());
            }
            currentUri = currentUri.parent;
        }
        return undefined;
    }

    async isSketchFolder(uri: string): Promise<boolean> {
        const fsPath = FileUri.fsPath(uri);
        let stat: fs.Stats | undefined;
        try {
            stat = await promisify(fs.lstat)(fsPath);
        } catch { }
        if (stat && stat.isDirectory()) {
            const basename = path.basename(fsPath);
            const files = await promisify(fs.readdir)(fsPath);
            for (let i = 0; i < files.length; i++) {
                if (files[i] === basename + '.ino') {
                    try {
                        await this.loadSketch(FileUri.create(fsPath).toString());
                        return true;
                    } catch { }
                }
            }
        }
        return false;
    }

    async isTemp(sketch: Sketch): Promise<boolean> {
        let sketchPath = FileUri.fsPath(sketch.uri);
        let temp = os.tmpdir();
        // Note: VS Code URI normalizes the drive letter. `C:` will be converted into `c:`.
        // https://github.com/Microsoft/vscode/issues/68325#issuecomment-462239992
        if (isWindows) {
            if (WIN32_DRIVE_REGEXP.exec(sketchPath)) {
                sketchPath = firstToLowerCase(sketchPath);
            }
            if (WIN32_DRIVE_REGEXP.exec(temp)) {
                temp = firstToLowerCase(temp);
            }
        }
        return sketchPath.indexOf(prefix) !== -1 && sketchPath.startsWith(temp);
    }

    async copy(sketch: Sketch, { destinationUri }: { destinationUri: string }): Promise<string> {
        const source = FileUri.fsPath(sketch.uri);
        const exists = await promisify(fs.exists)(source);
        if (!exists) {
            throw new Error(`Sketch does not exist: ${sketch}`);
        }
        // Nothing to do when source and destination are the same.
        if (sketch.uri === destinationUri) {
            await this.loadSketch(sketch.uri); // Sanity check.
            return sketch.uri;
        }
        const destination = FileUri.fsPath(destinationUri);
        await new Promise<void>((resolve, reject) => {
            ncp.ncp(source, destination, async error => {
                if (error) {
                    reject(error);
                    return;
                }
                const newName = path.basename(destination);
                try {
                    const oldPath = path.join(destination, new URI(sketch.mainFileUri).path.base);
                    const newPath = path.join(destination, `${newName}.ino`);
                    if (oldPath !== newPath) {
                        await promisify(fs.rename)(oldPath, newPath);
                    }
                    await this.loadSketch(destinationUri); // Sanity check.
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        });
        return FileUri.create(destination).toString();
    }

}

class SkipDir extends Error {
    constructor() {
        super('skip this directory');
        Object.setPrototypeOf(this, SkipDir.prototype);
    }
}

interface SketchWithDetails extends Sketch {
    readonly mtimeMs: number;
}

