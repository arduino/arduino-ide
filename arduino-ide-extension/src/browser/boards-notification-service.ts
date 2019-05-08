import { EventEmitter } from "events";
import { injectable } from "inversify";

// TODO (post-PoC): move this to the backend / BoardsService
@injectable()
export class BoardsNotificationService {

    protected readonly emitter = new EventEmitter();

    public on(event: 'boards-installed', listener: (...args: any[]) => void): this {
        this.emitter.on(event, listener);
        return this;
    }

    public notifyBoardsInstalled() {
        this.emitter.emit('boards-installed');
    }

}