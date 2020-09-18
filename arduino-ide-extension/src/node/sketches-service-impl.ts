import { injectable, inject } from 'inversify';
import * as os from 'os';
import * as temp from 'temp';
import * as path from 'path';
import { ncp } from 'ncp';
import { Stats } from 'fs';
import * as fs from './fs-extra';
import URI from '@theia/core/lib/common/uri';
import { FileUri } from '@theia/core/lib/node';
import { isWindows } from '@theia/core/lib/common/os';
import { ConfigService } from '../common/protocol/config-service';
import { SketchesService, Sketch } from '../common/protocol/sketches-service';
import { firstToLowerCase } from '../common/utils';


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
                try {
                    const stat = await fs.stat(filePath);
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
        return sketches.sort((left, right) => right.mtimeMs - left.mtimeMs);
    }

    /**
     * This is the TS implementation of `SketchLoad` from the CLI.
     * See: https://github.com/arduino/arduino-cli/issues/837
     * Based on: https://github.com/arduino/arduino-cli/blob/eef3705c4afcba4317ec38b803d9ffce5dd59a28/arduino/builder/sketch.go#L100-L215
     */
    async loadSketch(uri: string): Promise<Sketch> {
        const sketchPath = FileUri.fsPath(uri);
        const exists = await fs.exists(sketchPath);
        if (!exists) {
            throw new Error(`${uri} does not exist.`);
        }
        const stat = await fs.lstat(sketchPath);
        let sketchFolder: string | undefined;
        let mainSketchFile: string | undefined;

        // If a sketch folder was passed, save the parent and point sketchPath to the main sketch file
        if (stat.isDirectory()) {
            sketchFolder = sketchPath;
            // Allowed extensions are .ino and .pde (but not both)
            for (const extension of Sketch.Extensions.MAIN) {
                const candidateSketchFile = path.join(sketchPath, `${path.basename(sketchPath)}${extension}`);
                const candidateExists = await fs.exists(candidateSketchFile);
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
                await fs.access(mainSketchFile, fs.constants.R_OK);
            } catch {
                throw new Error('Unable to open the main sketch file.');
            }

            const mainSketchFileStat = await fs.lstat(mainSketchFile);
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
                await fs.access(fsPath, fs.constants.R_OK);
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

    private newSketch(sketchFolderPath: string, mainFilePath: string, allFilesPaths: string[]): Sketch {
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

        return {
            uri: FileUri.create(sketchFolderPath).toString(),
            mainFileUri: FileUri.create(mainFile).toString(),
            name: path.basename(sketchFolderPath),
            additionalFileUris: additionalFiles.map(p => FileUri.create(p).toString()),
            otherSketchFileUris: otherSketchFiles.map(p => FileUri.create(p).toString())
        }
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
                files.push(...await fs.readdir(root));
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
        const exists = await fs.exists(fsPath);
        if (!exists) {
            return { info: undefined, err: new Error(`${fsPath} does not exist`) };
        }
        try {
            const info = await fs.lstat(fsPath);
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
            if (fs.existsSync(path.join(user, sketchNameCandidate))) {
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
        await fs.mkdirp(sketchDir);
        await fs.writeFile(sketchFile, `void setup() {
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
        if (fs.existsSync(fsPath) && fs.lstatSync(fsPath).isDirectory()) {
            const basename = path.basename(fsPath);
            const files = await fs.readdir(fsPath);
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
        const exists = await fs.exists(source);
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
                    await fs.rename(oldPath, newPath);
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
