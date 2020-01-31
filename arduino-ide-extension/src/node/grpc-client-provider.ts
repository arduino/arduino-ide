import { inject, injectable, postConstruct } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { MaybePromise } from '@theia/core/lib/common/types';
import { ConfigServiceImpl } from './config-service-impl';
import { ArduinoDaemonImpl } from './arduino-daemon-impl';

@injectable()
export abstract class GrpcClientProvider<C> {

    @inject(ILogger)
    protected readonly logger: ILogger;

    @inject(ArduinoDaemonImpl)
    protected readonly daemon: ArduinoDaemonImpl;

    @inject(ConfigServiceImpl)
    protected readonly configService: ConfigServiceImpl;

    protected _port: string | number | undefined;
    protected _client: C | undefined;

    @postConstruct()
    protected init(): void {
        const updateClient = () => {
            const cliConfig = this.configService.cliConfiguration;
            this.reconcileClient(cliConfig ? cliConfig.daemon.port : undefined);
        }
        this.configService.onConfigChange(updateClient);
        this.daemon.ready.then(updateClient);
        this.daemon.onDaemonStopped(() => {
            if (this._client) {
                this.close(this._client);
            }
            this._client = undefined;
            this._port = undefined;
        })
    }

    async client(): Promise<C | undefined> {
        try {
            await this.daemon.ready;
            return this._client;
        } catch (error) {
            return undefined;
        }
    }

    protected async reconcileClient(port: string | number | undefined): Promise<void> {
        if (this._port === port) {
            return; // Nothing to do.
        }
        this._port = port;
        if (this._client) {
            this.close(this._client);
            this._client = undefined;
        }
        if (this._port) {
            try {
                const client = await this.createClient(this._port);
                this._client = client;
            } catch (error) {
                this.logger.error('Could create client for gRPC.', error)
            }
        }
    }

    protected abstract createClient(port: string | number): MaybePromise<C>;

    protected abstract close(client: C): void;

}
