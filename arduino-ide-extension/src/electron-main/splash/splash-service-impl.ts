import { injectable } from 'inversify';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { SplashService } from '../../electron-common/splash-service';

@injectable()
export class SplashServiceImpl implements SplashService {

    protected requested = false;
    protected readonly onCloseRequestedEmitter = new Emitter<void>();

    get onCloseRequested(): Event<void> {
        return this.onCloseRequestedEmitter.event;
    }

    async requestClose(): Promise<void> {
        if (!this.requested) {
            this.requested = true;
            this.onCloseRequestedEmitter.fire()
        }
    }

}
