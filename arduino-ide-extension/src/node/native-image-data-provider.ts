import { Deferred } from '@theia/core/lib/common/promise-util';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { Application } from '@theia/core/shared/express';
import { injectable } from '@theia/core/shared/inversify';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ErrnoException } from './utils/errors';

@injectable()
export class NativeImageDataProvider implements BackendApplicationContribution {
  private readonly rootPath = join(__dirname, '../../src/node/static/icons');
  private readonly dataCache = new Map<string, Promise<Buffer | undefined>>();

  onStart(): void {
    console.log(`Serving native images from ${this.rootPath}`);
  }

  configure(app: Application): void {
    app.get('/nativeImage/:filename', async (req, resp) => {
      const filename = req.params.filename;
      if (!filename) {
        resp.status(400).send('Bad Request');
        return;
      }
      try {
        const data = await this.getOrCreateData(filename);
        if (!data) {
          resp.status(404).send('Not found');
          return;
        }
        resp.send(data);
      } catch (err) {
        resp.status(500).send(err instanceof Error ? err.message : String(err));
      }
    });
  }

  private async getOrCreateData(filename: string): Promise<Buffer | undefined> {
    let data = this.dataCache.get(filename);
    if (!data) {
      const deferred = new Deferred<Buffer | undefined>();
      data = deferred.promise;
      this.dataCache.set(filename, data);
      const path = join(this.rootPath, filename);
      fs.readFile(path).then(
        (buffer) => deferred.resolve(buffer),
        (err) => {
          if (ErrnoException.isENOENT(err)) {
            console.error(`File not found: ${path}`);
            deferred.resolve(undefined);
          } else {
            console.error(`Failed to load file: ${path}`, err);
            this.dataCache.delete(filename);
            deferred.reject(err);
          }
        }
      );
    }
    return data;
  }
}
