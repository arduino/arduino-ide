import { inject, injectable, postConstruct } from 'inversify';
import { Diagnostic } from 'vscode-languageserver-types';
import URI from '@theia/core/lib/common/uri';
import { Marker } from '@theia/markers/lib/common/marker';
import { ProblemManager } from '@theia/markers/lib/browser/problem/problem-manager';
import { ConfigService } from '../../common/protocol/config-service';

@injectable()
export class ArduinoProblemManager extends ProblemManager {

    @inject(ConfigService)
    protected readonly configService: ConfigService;
    protected dataDirUri: URI | undefined;

    @postConstruct()
    protected init(): void {
        super.init();
        this.configService.getConfiguration().then(({ dataDirUri }) => this.dataDirUri = new URI(dataDirUri));
    }

    setMarkers(uri: URI, owner: string, data: Diagnostic[]): Marker<Diagnostic>[] {
        if (this.dataDirUri && this.dataDirUri.isEqualOrParent(uri)) {
            return [];
        }
        return super.setMarkers(uri, owner, data);
    }

}
