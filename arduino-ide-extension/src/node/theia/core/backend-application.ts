import { injectable } from 'inversify';
import { BackendApplication as TheiaBackendApplication } from '@theia/core/lib/node/backend-application';
import type { Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';
import { duration } from '../../../common/decorators';

@injectable()
export class BackendApplication extends TheiaBackendApplication {
  @duration({ name: 'backend-application#start' })
  start(port?: number, hostname?: string): Promise<HttpServer | HttpsServer> {
    return super.start(port, hostname);
  }
}
