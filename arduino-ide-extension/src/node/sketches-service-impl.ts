import { injectable, inject, named } from '@theia/core/shared/inversify';
import { promises as fs, realpath, lstat, Stats, constants, rm } from 'fs';
import * as os from 'os';
import * as temp from 'temp';
import * as path from 'path';
import * as glob from 'glob';
import * as crypto from 'crypto';
import * as PQueue from 'p-queue';
import { ncp } from 'ncp';
import URI from '@theia/core/lib/common/uri';
import { ILogger } from '@theia/core/lib/common/logger';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { ConfigServiceImpl } from './config-service-impl';
import {
  SketchesService,
  Sketch,
  SketchRef,
  SketchContainer,
  SketchesError,
} from '../common/protocol/sketches-service';
import { NotificationServiceServerImpl } from './notification-service-server';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { CoreClientAware } from './core-client-provider';
import {
  ArchiveSketchRequest,
  LoadSketchRequest,
} from './cli-protocol/cc/arduino/cli/commands/v1/commands_pb';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { ServiceError } from './service-error';
import {
  IsTempSketch,
  maybeNormalizeDrive,
  TempSketchPrefix,
} from './is-temp-sketch';

const RecentSketches = 'recent-sketches.json';

@injectable()
export class SketchesServiceImpl
  extends CoreClientAware
  implements SketchesService
{
  private sketchSuffixIndex = 1;
  private lastSketchBaseName: string;
  private recentSketches: SketchWithDetails[] | undefined;
  private readonly markAsRecentSketchQueue = new PQueue({
    autoStart: true,
    concurrency: 1,
  });

  @inject(ILogger)
  @named('sketches-service')
  private readonly logger: ILogger;

  @inject(ConfigServiceImpl)
  private readonly configService: ConfigServiceImpl;

  @inject(NotificationServiceServerImpl)
  private readonly notificationService: NotificationServiceServerImpl;

  @inject(EnvVariablesServer)
  private readonly envVariableServer: EnvVariablesServer;

  @inject(IsTempSketch)
  private readonly isTempSketch: IsTempSketch;

  async getSketches({ uri }: { uri?: string }): Promise<SketchContainer> {
    const root = await this.root(uri);
    const pathToAllSketchFiles = await new Promise<string[]>(
      (resolve, reject) => {
        glob(
          '/!(libraries|hardware)/**/*.{ino,pde}',
          { root },
          (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          }
        );
      }
    );
    // Sort by path length to filter out nested sketches, such as the `Nested_folder` inside the `Folder` sketch.
    //
    // `directories#user`
    // |
    // +--Folder
    //    |
    //    +--Folder.ino
    //    |
    //    +--Nested_folder
    //       |
    //       +--Nested_folder.ino
    pathToAllSketchFiles.sort((left, right) => left.length - right.length);
    const container = SketchContainer.create(
      uri ? path.basename(root) : 'Sketchbook'
    );
    const getOrCreateChildContainer = (
      parent: SketchContainer,
      segments: string[]
    ) => {
      if (segments.length === 1) {
        throw new Error(
          `Expected at least two segments relative path: ['ExampleSketchName', 'ExampleSketchName.{ino,pde}]. Was: ${segments}`
        );
      }
      if (segments.length === 2) {
        return parent;
      }
      const label = segments[0];
      const existingSketch = parent.sketches.find(
        (sketch) => sketch.name === label
      );
      if (existingSketch) {
        // If the container has a sketch with the same label, it cannot have a child container.
        // See above example about how to ignore nested sketches.
        return undefined;
      }
      let child = parent.children.find((child) => child.label === label);
      if (!child) {
        child = SketchContainer.create(label);
        parent.children.push(child);
      }
      return child;
    };
    for (const pathToSketchFile of pathToAllSketchFiles) {
      const relative = path.relative(root, pathToSketchFile);
      if (!relative) {
        this.logger.warn(
          `Could not determine relative sketch path from the root <${root}> to the sketch <${pathToSketchFile}>. Skipping. Relative path was: ${relative}`
        );
        continue;
      }
      const segments = relative.split(path.sep);
      if (segments.length < 2) {
        // folder name, and sketch name.
        this.logger.warn(
          `Expected at least one segment relative path from the root <${root}> to the sketch <${pathToSketchFile}>. Skipping. Segments were: ${segments}.`
        );
        continue;
      }
      // the folder name and the sketch name must match. For example, `Foo/foo.ino` is invalid.
      // drop the folder name from the sketch name, if `.ino` or `.pde` remains, it's valid
      const sketchName = segments[segments.length - 2];
      const sketchFilename = segments[segments.length - 1];
      const sketchFileExtension = segments[segments.length - 1].replace(
        new RegExp(sketchName),
        ''
      );
      if (sketchFileExtension !== '.ino' && sketchFileExtension !== '.pde') {
        this.logger.warn(
          `Mismatching sketch file <${sketchFilename}> and sketch folder name <${sketchName}>. Skipping`
        );
        continue;
      }
      const child = getOrCreateChildContainer(container, segments);
      if (child) {
        child.sketches.push({
          name: sketchName,
          uri: FileUri.create(path.dirname(pathToSketchFile)).toString(),
        });
      }
    }
    return container;
  }

  private async root(uri?: string | undefined): Promise<string> {
    return FileUri.fsPath(uri ?? (await this.sketchbookUri()));
  }

  private async sketchbookUri(): Promise<string> {
    const { sketchDirUri } = await this.configService.getConfiguration();
    return sketchDirUri;
  }

  async loadSketch(uri: string): Promise<SketchWithDetails> {
    const { client, instance } = await this.coreClient;
    const req = new LoadSketchRequest();
    const requestSketchPath = FileUri.fsPath(uri);
    req.setSketchPath(requestSketchPath);
    req.setInstance(instance);
    const stat = new Deferred<Stats | Error>();
    lstat(requestSketchPath, (err, result) =>
      err ? stat.resolve(err) : stat.resolve(result)
    );
    const sketch = await new Promise<SketchWithDetails>((resolve, reject) => {
      client.loadSketch(req, async (err, resp) => {
        if (err) {
          let rejectWith: unknown = err;
          if (isNotFoundError(err)) {
            const invalidMainSketchFilePath = await isInvalidSketchNameError(
              err,
              requestSketchPath
            );
            if (invalidMainSketchFilePath) {
              rejectWith = SketchesError.InvalidName(
                err.details,
                FileUri.create(invalidMainSketchFilePath).toString()
              );
            } else {
              rejectWith = SketchesError.NotFound(err.details, uri);
            }
          }
          reject(rejectWith);
          return;
        }
        const responseSketchPath = maybeNormalizeDrive(resp.getLocationPath());
        if (requestSketchPath !== responseSketchPath) {
          this.logger.warn(
            `Warning! The request sketch path was different than the response sketch path from the CLI. This could be a potential bug. Request: <${requestSketchPath}>, response: <${responseSketchPath}>.`
          );
        }
        const resolvedStat = await stat.promise;
        if (resolvedStat instanceof Error) {
          this.logger.error(
            `The CLI could load the sketch from ${requestSketchPath}, but stating the folder has failed.`
          );
          reject(resolvedStat);
          return;
        }
        const { mtimeMs } = resolvedStat;
        resolve({
          name: path.basename(responseSketchPath),
          uri: FileUri.create(responseSketchPath).toString(),
          mainFileUri: FileUri.create(resp.getMainFile()).toString(),
          otherSketchFileUris: resp
            .getOtherSketchFilesList()
            .map((p) => FileUri.create(p).toString()),
          additionalFileUris: resp
            .getAdditionalFilesList()
            .map((p) => FileUri.create(p).toString()),
          rootFolderFileUris: resp
            .getRootFolderFilesList()
            .map((p) => FileUri.create(p).toString()),
          mtimeMs,
        });
      });
    });
    return sketch;
  }

  async maybeLoadSketch(uri: string): Promise<Sketch | undefined> {
    return this._isSketchFolder(uri);
  }

  private get recentSketchesFsPath(): Promise<string> {
    return this.envVariableServer
      .getConfigDirUri()
      .then((uri) => path.join(FileUri.fsPath(uri), RecentSketches));
  }

  private async loadRecentSketches(): Promise<Record<string, number>> {
    this.logger.debug(`>>> Loading recently opened sketches data.`);
    const fsPath = await this.recentSketchesFsPath;
    let data: Record<string, number> = {};
    try {
      const raw = await fs.readFile(fsPath, {
        encoding: 'utf8',
      });
      try {
        data = JSON.parse(raw);
      } catch (err) {
        this.logger.error(
          `Could not parse recently opened sketches. Raw input was: ${raw}`
        );
      }
    } catch (err) {
      if ('code' in err && err.code === 'ENOENT') {
        this.logger.debug(
          `<<< '${RecentSketches}' does not exist yet. This is normal behavior. Falling back to empty data.`
        );
        return {};
      }
      throw err;
    }
    this.logger.debug(
      `<<< Successfully loaded recently opened sketches data: ${JSON.stringify(
        data
      )}`
    );
    return data;
  }

  private async saveRecentSketches(
    data: Record<string, number>
  ): Promise<void> {
    this.logger.debug(
      `>>> Saving recently opened sketches data: ${JSON.stringify(data)}`
    );
    const fsPath = await this.recentSketchesFsPath;
    await fs.writeFile(fsPath, JSON.stringify(data, null, 2));
    this.logger.debug('<<< Successfully saved recently opened sketches data.');
  }

  async markAsRecentlyOpened(uri: string): Promise<void> {
    return this.markAsRecentSketchQueue.add(async () => {
      this.logger.debug(`Marking sketch at '${uri}' as recently opened.`);
      if (this.isTempSketch.is(FileUri.fsPath(uri))) {
        this.logger.debug(
          `Sketch at '${uri}' is pointing to a temp location. Not marking as recently opened.`
        );
        return;
      }

      let sketch: Sketch | undefined = undefined;
      try {
        sketch = await this.loadSketch(uri);
        this.logger.debug(
          `Loaded sketch ${JSON.stringify(
            sketch
          )} before marking it as recently opened.`
        );
      } catch (err) {
        if (
          SketchesError.NotFound.is(err) ||
          SketchesError.InvalidName.is(err)
        ) {
          this.logger.debug(
            `Could not load sketch from '${uri}'. Not marking as recently opened.`
          );
          return;
        }
        this.logger.error(
          `Unexpected error occurred while loading sketch from '${uri}'.`,
          err
        );
        throw err;
      }

      const data = await this.loadRecentSketches();
      const now = Date.now();
      this.logger.debug(
        `Marking sketch '${uri}' as recently opened with timestamp: '${now}'.`
      );
      data[sketch.uri] = now;

      let toDelete: [string, number] | undefined = undefined;
      if (Object.keys(data).length > 10) {
        let min = Number.MAX_SAFE_INTEGER;
        for (const [uri, timestamp] of Object.entries(data)) {
          if (min > timestamp) {
            min = data[uri];
            toDelete = [uri, timestamp];
          }
        }
      }

      if (toDelete) {
        const [toDeleteUri] = toDelete;
        delete data[toDeleteUri];
        this.logger.debug(
          `Deleted sketch entry ${JSON.stringify(
            toDelete
          )} from recently opened.`
        );
      }

      await this.saveRecentSketches(data);
      this.logger.debug(`Marked sketch '${uri}' as recently opened.`);
      const sketches = await this.recentlyOpenedSketches(data);
      this.notificationService.notifyRecentSketchesDidChange({ sketches });
    });
  }

  async recentlyOpenedSketches(
    forceUpdate?: Record<string, number> | boolean
  ): Promise<Sketch[]> {
    if (!this.recentSketches || forceUpdate) {
      const data =
        forceUpdate && typeof forceUpdate === 'object'
          ? forceUpdate
          : await this.loadRecentSketches();
      const sketches: SketchWithDetails[] = [];
      let needsUpdate = false;
      for (const uri of Object.keys(data).sort(
        (left, right) => data[right] - data[left]
      )) {
        let sketch: SketchWithDetails | undefined = undefined;
        try {
          sketch = await this.loadSketch(uri);
        } catch {}
        if (!sketch) {
          needsUpdate = true;
        } else {
          sketches.push(sketch);
        }
      }
      if (needsUpdate) {
        const data = sketches.reduce((acc, curr) => {
          acc[curr.uri] = curr.mtimeMs;
          return acc;
        }, {} as Record<string, number>);
        await this.saveRecentSketches(data);
        this.notificationService.notifyRecentSketchesDidChange({ sketches });
      }
      this.recentSketches = sketches;
    }
    return this.recentSketches;
  }

  async cloneExample(uri: string): Promise<Sketch> {
    const [sketch, parentPath] = await Promise.all([
      this.loadSketch(uri),
      this.createTempFolder(),
    ]);
    const destinationUri = FileUri.create(
      path.join(parentPath, sketch.name)
    ).toString();
    const copiedSketchUri = await this.copy(sketch, { destinationUri });
    return this.loadSketch(copiedSketchUri);
  }

  async createNewSketch(): Promise<Sketch> {
    const monthNames = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ];
    const today = new Date();
    const parentPath = await this.createTempFolder();
    const sketchBaseName = `sketch_${
      monthNames[today.getMonth()]
    }${today.getDate()}`;
    const config = await this.configService.getConfiguration();
    const sketchbookPath = FileUri.fsPath(config.sketchDirUri);
    let sketchName: string | undefined;

    // If it's another day, reset the count of sketches created today
    if (this.lastSketchBaseName !== sketchBaseName) this.sketchSuffixIndex = 1;

    let nameFound = false;
    while (!nameFound) {
      const sketchNameCandidate = `${sketchBaseName}${sketchIndexToLetters(
        this.sketchSuffixIndex++
      )}`;
      // Note: we check the future destination folder (`directories.user`) for name collision and not the temp folder!
      const sketchExists = await this.exists(
        path.join(sketchbookPath, sketchNameCandidate)
      );
      if (!sketchExists) {
        nameFound = true;
        sketchName = sketchNameCandidate;
      }
    }

    if (!sketchName) {
      throw new Error('Cannot create a unique sketch name');
    }
    this.lastSketchBaseName = sketchBaseName;

    const sketchDir = path.join(parentPath, sketchName);
    const sketchFile = path.join(sketchDir, `${sketchName}.ino`);
    await fs.mkdir(sketchDir, { recursive: true });
    await fs.writeFile(
      sketchFile,
      `void setup() {
  // put your setup code here, to run once:

}

void loop() {
  // put your main code here, to run repeatedly:

}
`,
      { encoding: 'utf8' }
    );
    return this.loadSketch(FileUri.create(sketchDir).toString());
  }

  /**
   * Creates a temp folder and returns with a promise that resolves with the canonicalized absolute pathname of the newly created temp folder.
   * This method ensures that the file-system path pointing to the new temp directory is fully resolved.
   * For example, on Windows, instead of getting an [8.3 filename](https://en.wikipedia.org/wiki/8.3_filename), callers will get a fully resolved path.
   * `C:\\Users\\KITTAA~1\\AppData\\Local\\Temp\\.arduinoIDE-unsaved2022615-21100-iahybb.yyvh\\sketch_jul15a` will be `C:\\Users\\kittaakos\\AppData\\Local\\Temp\\.arduinoIDE-unsaved2022615-21100-iahybb.yyvh\\sketch_jul15a`
   */
  private createTempFolder(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      temp.mkdir({ prefix: TempSketchPrefix }, (createError, dirPath) => {
        if (createError) {
          reject(createError);
          return;
        }
        realpath.native(dirPath, (resolveError, resolvedDirPath) => {
          if (resolveError) {
            reject(resolveError);
            return;
          }
          resolve(resolvedDirPath);
        });
      });
    });
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

  private async _isSketchFolder(
    uri: string
  ): Promise<SketchWithDetails | undefined> {
    try {
      const sketch = await this.loadSketch(uri);
      return sketch;
    } catch (err) {
      if (SketchesError.NotFound.is(err) || SketchesError.InvalidName.is(err)) {
        return undefined;
      }
      throw err;
    }
  }

  async isTemp(sketch: SketchRef): Promise<boolean> {
    return this.isTempSketch.is(FileUri.fsPath(sketch.uri));
  }

  async copy(
    sketch: Sketch,
    { destinationUri }: { destinationUri: string }
  ): Promise<string> {
    const source = FileUri.fsPath(sketch.uri);
    const exists = await this.exists(source);
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
        ncp.ncp(sourcePath, destinationPath, async (error) => {
          if (error) {
            reject(error);
            return;
          }
          const newName = path.basename(destinationPath);
          try {
            const oldPath = path.join(
              destinationPath,
              new URI(sketch.mainFileUri).path.base
            );
            const newPath = path.join(destinationPath, `${newName}.ino`);
            if (oldPath !== newPath) {
              await fs.rename(oldPath, newPath);
            }
            await this.loadSketch(FileUri.create(destinationPath).toString()); // Sanity check.
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    };
    // https://github.com/arduino/arduino-ide/issues/65
    // When copying `/path/to/sketchbook/sketch_A` to `/path/to/sketchbook/sketch_A/anything` on a non-POSIX filesystem,
    // `ncp` makes a recursion and copies the folders over and over again. In such cases, we copy the source into a temp folder,
    // then move it to the desired destination.
    const destination = FileUri.fsPath(destinationUri);
    let tempDestination = await this.createTempFolder();
    tempDestination = path.join(tempDestination, sketch.name);
    await fs.mkdir(tempDestination, { recursive: true });
    await copy(source, tempDestination);
    await copy(tempDestination, destination);
    return FileUri.create(destination).toString();
  }

  async archive(sketch: Sketch, destinationUri: string): Promise<string> {
    await this.loadSketch(sketch.uri); // sanity check
    const { client } = await this.coreClient;
    const archivePath = FileUri.fsPath(destinationUri);
    // The CLI cannot override existing archives, so we have to wipe it manually: https://github.com/arduino/arduino-cli/issues/1160
    if (await this.exists(archivePath)) {
      await fs.unlink(archivePath);
    }
    const req = new ArchiveSketchRequest();
    req.setSketchPath(FileUri.fsPath(sketch.uri));
    req.setArchivePath(archivePath);
    await new Promise<string>((resolve, reject) => {
      client.archiveSketch(req, (err) => {
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
    await fs.readdir(sketchPath); // Validates the sketch folder and rejects if not accessible.
    const suffix = crypto.createHash('md5').update(sketchPath).digest('hex');
    return path.join(os.tmpdir(), `arduino-ide2-${suffix}`);
  }

  async deleteSketch(sketch: Sketch): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sketchPath = FileUri.fsPath(sketch.uri);
      rm(sketchPath, { recursive: true, maxRetries: 5 }, (error) => {
        if (error) {
          this.logger.error(`Failed to delete sketch at ${sketchPath}.`, error);
          reject(error);
        } else {
          this.logger.info(`Successfully deleted sketch at ${sketchPath}.`);
          resolve();
        }
      });
    });
  }

  private async exists(pathLike: string): Promise<boolean> {
    try {
      await fs.access(pathLike, constants.R_OK | constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}

interface SketchWithDetails extends Sketch {
  readonly mtimeMs: number;
}

function isNotFoundError(err: unknown): err is ServiceError {
  return ServiceError.is(err) && err.code === 5; // `NOT_FOUND` https://grpc.github.io/grpc/core/md_doc_statuscodes.html
}

/**
 * Tries to detect whether the error was caused by an invalid main sketch file name.
 * IDE2 should handle gracefully when there is an invalid sketch folder name. See the [spec](https://arduino.github.io/arduino-cli/latest/sketch-specification/#sketch-root-folder) for details.
 * The CLI does not have error codes (https://github.com/arduino/arduino-cli/issues/1762), so IDE2 parses the error message and tries to guess it.
 * Nothing guarantees that the invalid existing main sketch file still exits by the time client performs the sketch move.
 */
async function isInvalidSketchNameError(
  cliErr: unknown,
  requestSketchPath: string
): Promise<string | undefined> {
  if (isNotFoundError(cliErr)) {
    const ino = requestSketchPath.endsWith('.ino');
    if (ino) {
      const sketchFolderPath = path.dirname(requestSketchPath);
      const sketchName = path.basename(sketchFolderPath);
      const pattern = `${invalidSketchNameErrorRegExpPrefix}${path.join(
        sketchFolderPath,
        `${sketchName}.ino`
      )}`.replace(/\\/g, '\\\\'); // make windows path separator with \\ to have a valid regexp.
      if (new RegExp(pattern, 'i').test(cliErr.details)) {
        try {
          await fs.access(requestSketchPath);
          return requestSketchPath;
        } catch {
          return undefined;
        }
      }
    } else {
      try {
        const resources = await fs.readdir(requestSketchPath, {
          withFileTypes: true,
        });
        return (
          resources
            .filter((resource) => resource.isFile())
            .filter((resource) => resource.name.endsWith('.ino'))
            // A folder might contain multiple sketches. It's OK to ick the first one as IDE2 cannot do much,
            // but ensure a deterministic behavior as `readdir(3)` does not guarantee an order. Sort them.
            .sort(({ name: left }, { name: right }) =>
              left.localeCompare(right)
            )
            .map(({ name }) => name)
            .map((name) => path.join(requestSketchPath, name))[0]
        );
      } catch (err) {
        if ('code' in err && err.code === 'ENOTDIR') {
          return undefined;
        }
        throw err;
      }
    }
  }
  return undefined;
}
const invalidSketchNameErrorRegExpPrefix =
  '.*: main file missing from sketch: ';

/*
 * When a new sketch is created, add a suffix to distinguish it
 * from other new sketches I created today.
 * If 'sketch_jul8a' is already used, go with 'sketch_jul8b'.
 * If 'sketch_jul8b' already used, go with 'sketch_jul8c'.
 * When it reach 'sketch_jul8z', go with 'sketch_jul8aa',
 * and so on.
 */
function sketchIndexToLetters(num: number): string {
  let out = '';
  let pow;
  do {
    pow = Math.floor(num / 26);
    const mod = num % 26;
    out = (mod ? String.fromCharCode(96 + mod) : (--pow, 'z')) + out;
    num = pow;
  } while (pow > 0);
  return out;
}
