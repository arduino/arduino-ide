import { injectable, inject } from 'inversify';
import * as minimatch from 'minimatch';
import * as fs from 'fs';
import * as os from 'os';
import * as temp from 'temp';
import * as path from 'path';
import * as crypto from 'crypto';
import { ncp } from 'ncp';
import { promisify } from 'util';
import URI from '@theia/core/lib/common/uri';
import { FileUri } from '@theia/core/lib/node';
import { isWindows } from '@theia/core/lib/common/os';
import { ConfigService } from '../common/protocol/config-service';
import { SketchesService, Sketch, SketchContainer } from '../common/protocol/sketches-service';
import { firstToLowerCase } from '../common/utils';
import { NotificationServiceServerImpl } from './notification-service-server';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { CoreClientAware } from './core-client-provider';
import { LoadSketchReq, ArchiveSketchReq } from './cli-protocol/commands/commands_pb';

const WIN32_DRIVE_REGEXP = /^[a-zA-Z]:\\/;

const prefix = '.arduinoIDE-unsaved';

@injectable()
export class SketchesServiceImpl extends CoreClientAware implements SketchesService {

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    @inject(NotificationServiceServerImpl)
    protected readonly notificationService: NotificationServiceServerImpl;

    @inject(EnvVariablesServer)
    protected readonly envVariableServer: EnvVariablesServer;
    async getSketches({ uri, exclude }: { uri?: string, exclude?: string[] }): Promise<SketchContainerWithDetails> {
        const start = Date.now();
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
        const container: SketchContainerWithDetails = {
            label: uri ? path.basename(sketchbookPath) : 'Sketchbook',
            sketches: [],
            children: []
        };
        if (!await promisify(fs.exists)(sketchbookPath)) {
            return container;
        }
        const stat = await promisify(fs.stat)(sketchbookPath);
        if (!stat.isDirectory()) {
            return container;
        }

        const recursivelyLoad = async (fsPath: string, containerToLoad: SketchContainerWithDetails) => {
            const filenames = await promisify(fs.readdir)(fsPath);
            for (const name of filenames) {
                const childFsPath = path.join(fsPath, name);
                let skip = false;
                for (const pattern of exclude || ['**/libraries/**', '**/hardware/**']) {
                    if (!skip && minimatch(childFsPath, pattern)) {
                        skip = true;
                    }
                }
                if (skip) {
                    continue;
                }
                try {
                    const stat = await promisify(fs.stat)(childFsPath);
                    if (stat.isDirectory()) {
                        const sketch = await this._isSketchFolder(FileUri.create(childFsPath).toString());
                        if (sketch) {
                            containerToLoad.sketches.push({
                                ...sketch,
                                mtimeMs: stat.mtimeMs
                            });
                        } else {
                            const childContainer: SketchContainerWithDetails = {
                                label: name,
                                children: [],
                                sketches: []
                            };
                            await recursivelyLoad(childFsPath, childContainer);
                            if (!SketchContainer.isEmpty(childContainer)) {
                                containerToLoad.children.push(childContainer);
                            }
                        }
                    }
                } catch {
                    console.warn(`Could not load sketch from ${childFsPath}.`);
                }
            }
            containerToLoad.sketches.sort((left, right) => right.mtimeMs - left.mtimeMs);
            return containerToLoad;
        }

        await recursivelyLoad(sketchbookPath, container);
        SketchContainer.prune(container);
        console.debug(`Loading the sketches from ${sketchbookPath} took ${Date.now() - start} ms.`);
        return container;
    }

    async loadSketch(uri: string): Promise<SketchWithDetails> {
        const { client, instance } = await this.coreClient();
        const req = new LoadSketchReq();
        req.setSketchPath(FileUri.fsPath(uri));
        req.setInstance(instance);
        const sketch = await new Promise<SketchWithDetails>((resolve, reject) => {
            client.loadSketch(req, async (err, resp) => {
                if (err) {
                    reject(err);
                    return;
                }
                const sketchFolderPath = resp.getLocationPath();
                const { mtimeMs } = await promisify(fs.lstat)(sketchFolderPath);
                resolve({
                    name: path.basename(sketchFolderPath),
                    uri: FileUri.create(sketchFolderPath).toString(),
                    mainFileUri: FileUri.create(resp.getMainFile()).toString(),
                    otherSketchFileUris: resp.getOtherSketchFilesList().map(p => FileUri.create(p).toString()),
                    additionalFileUris: resp.getAdditionalFilesList().map(p => FileUri.create(p).toString()),
                    rootFolderFileUris: resp.getRootFolderFilesList().map(p => FileUri.create(p).toString()),
                    mtimeMs
                });
            });
        });
        return sketch;
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
            const sketch = await this._isSketchFolder(currentUri.toString());
            if (sketch) {
                return sketch;
            }
            currentUri = currentUri.parent;
        }
        return undefined;
    }

    async isSketchFolder(uri: string): Promise<boolean> {
        const sketch = await this._isSketchFolder(uri);
        return !!sketch;
    }

    private async _isSketchFolder(uri: string): Promise<SketchWithDetails | undefined> {
        const fsPath = FileUri.fsPath(uri);
        let stat: fs.Stats | undefined;
        try {
            stat = await promisify(fs.lstat)(fsPath);
        } catch { }
        if (stat && stat.isDirectory()) {
            const basename = path.basename(fsPath);
            const files = await promisify(fs.readdir)(fsPath);
            for (let i = 0; i < files.length; i++) {
                if (files[i] === basename + '.ino' || files[i] === basename + '.pde') {
                    try {
                        const sketch = await this.loadSketch(FileUri.create(fsPath).toString());
                        return sketch;
                    } catch { }
                }
            }
        }
        return undefined;
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

        const copy = async (sourcePath: string, destinationPath: string) => {
            return new Promise<void>((resolve, reject) => {
                ncp.ncp(sourcePath, destinationPath, async error => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    const newName = path.basename(destinationPath);
                    try {
                        const oldPath = path.join(destinationPath, new URI(sketch.mainFileUri).path.base);
                        const newPath = path.join(destinationPath, `${newName}.ino`);
                        if (oldPath !== newPath) {
                            await promisify(fs.rename)(oldPath, newPath);
                        }
                        await this.loadSketch(FileUri.create(destinationPath).toString()); // Sanity check.
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        }
        // https://github.com/arduino/arduino-ide/issues/65
        // When copying `/path/to/sketchbook/sketch_A` to `/path/to/sketchbook/sketch_A/anything` on a non-POSIX filesystem,
        // `ncp` makes a recursion and copies the folders over and over again. In such cases, we copy the source into a temp folder,
        // then move it to the desired destination.
        const destination = FileUri.fsPath(destinationUri);
        let tempDestination = await new Promise<string>((resolve, reject) => {
            temp.track().mkdir({ prefix }, async (err, dirPath) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(dirPath);
            });
        });
        tempDestination = path.join(tempDestination, sketch.name);
        await fs.promises.mkdir(tempDestination, { recursive: true });
        await copy(source, tempDestination);
        await copy(tempDestination, destination);
        return FileUri.create(destination).toString();
    }

    async archive(sketch: Sketch, destinationUri: string): Promise<string> {
        await this.loadSketch(sketch.uri); // sanity check
        const { client } = await this.coreClient();
        const archivePath = FileUri.fsPath(destinationUri);
        // The CLI cannot override existing archives, so we have to wipe it manually: https://github.com/arduino/arduino-cli/issues/1160
        if (await promisify(fs.exists)(archivePath)) {
            await promisify(fs.unlink)(archivePath);
        }
        const req = new ArchiveSketchReq();
        req.setSketchPath(FileUri.fsPath(sketch.uri));
        req.setArchivePath(archivePath);
        await new Promise<string>((resolve, reject) => {
            client.archiveSketch(req, err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(destinationUri);
            });
        });
        return destinationUri;
    }

    async getIdeTempFolderUri(sketch: Sketch): Promise<string> {
        const genBuildPath = await this.getIdeTempFolderPath(sketch);
        return FileUri.create(genBuildPath).toString();
    }

    async getIdeTempFolderPath(sketch: Sketch): Promise<string> {
        const sketchPath = FileUri.fsPath(sketch.uri);
        await fs.promises.readdir(sketchPath); // Validates the sketch folder and rejects if not accessible.
        const suffix = crypto.createHash('md5').update(sketchPath).digest('hex');
        return path.join(os.tmpdir(), `arduino-ide2-${suffix}`);
    }

}

interface SketchWithDetails extends Sketch {
    readonly mtimeMs: number;
}
interface SketchContainerWithDetails extends SketchContainer {
    readonly label: string;
    readonly children: SketchContainerWithDetails[];
    readonly sketches: SketchWithDetails[];
}
