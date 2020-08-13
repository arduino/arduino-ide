import { inject, injectable, postConstruct } from 'inversify';
import { JsonRpcProxy } from '@theia/core/lib/common/messaging/proxy-factory';
import { Event, Emitter } from '@theia/core/lib/common/event';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Searchable, InstalledEvent, UninstalledEvent } from '../../common/protocol';
import { LibraryPackage, LibraryServiceServer, LibraryService } from '../../common/protocol/library-service';

@injectable()
export class LibraryServiceProvider implements Required<LibraryService> {

    @inject(LibraryServiceServer)
    protected readonly server: JsonRpcProxy<LibraryServiceServer>;

    protected readonly onLibraryPackageInstalledEmitter = new Emitter<InstalledEvent<LibraryPackage>>();
    protected readonly onLibraryPackageUninstalledEmitter = new Emitter<UninstalledEvent<LibraryPackage>>();
    protected readonly toDispose = new DisposableCollection(
        this.onLibraryPackageInstalledEmitter,
        this.onLibraryPackageUninstalledEmitter
    );

    @postConstruct()
    protected init(): void {
        this.server.setClient({
            notifyInstalled: event => this.onLibraryPackageInstalledEmitter.fire(event),
            notifyUninstalled: event => this.onLibraryPackageUninstalledEmitter.fire(event)
        });
    }

    get onLibraryPackageInstalled(): Event<InstalledEvent<LibraryPackage>> {
        return this.onLibraryPackageInstalledEmitter.event;
    }

    get onLibraryPackageUninstalled(): Event<InstalledEvent<LibraryPackage>> {
        return this.onLibraryPackageUninstalledEmitter.event;
    }

    // #region remote library service API

    async install(options: { item: LibraryPackage; version?: string | undefined; }): Promise<void> {
        return this.server.install(options);
    }

    async list(options: LibraryService.List.Options): Promise<LibraryPackage[]> {
        return this.server.list(options);
    }

    async uninstall(options: { item: LibraryPackage; }): Promise<void> {
        return this.server.uninstall(options);
    }

    async search(options: Searchable.Options): Promise<LibraryPackage[]> {
        return this.server.search(options);
    }

    // #endregion remote API

    dispose(): void {
        this.toDispose.dispose();
    }

}
