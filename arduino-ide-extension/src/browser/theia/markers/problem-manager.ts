import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { Diagnostic } from '@theia/core/shared/vscode-languageserver-types';
import URI from '@theia/core/lib/common/uri';
import { Marker } from '@theia/markers/lib/common/marker';
import { ProblemManager as TheiaProblemManager } from '@theia/markers/lib/browser/problem/problem-manager';
import { ConfigServiceClient } from '../../config/config-service-client';
import debounce from 'lodash.debounce';
import {
  ARDUINO_CLOUD_FOLDER,
  REMOTE_SKETCHBOOK_FOLDER,
} from '../../utils/constants';

@injectable()
export class ProblemManager extends TheiaProblemManager {
  @inject(ConfigServiceClient)
  private readonly configService: ConfigServiceClient;

  private dataDirUri: URI | undefined;
  private cloudCacheDirUri: URI | undefined;

  @postConstruct()
  protected override init(): void {
    super.init();
    this.dataDirUri = this.configService.tryGetDataDirUri();
    this.configService.onDidChangeDataDirUri((uri) => {
      this.dataDirUri = uri;
      this.cloudCacheDirUri = this.dataDirUri
        ?.resolve(REMOTE_SKETCHBOOK_FOLDER)
        .resolve(ARDUINO_CLOUD_FOLDER);
    });
  }

  override setMarkers(
    uri: URI,
    owner: string,
    data: Diagnostic[]
  ): Marker<Diagnostic>[] {
    if (
      this.dataDirUri &&
      this.dataDirUri.isEqualOrParent(uri) &&
      this.cloudCacheDirUri && // Do not disable the diagnostics for cloud sketches https://github.com/arduino/arduino-ide/issues/669
      !this.cloudCacheDirUri.isEqualOrParent(uri)
    ) {
      // If in directories.data folder but not in the cloud sketchbook cache folder.
      return [];
    }
    return super.setMarkers(uri, owner, data);
  }

  private readonly debouncedFireOnDidChangeMakers = debounce(
    (uri: URI) => this.onDidChangeMarkersEmitter.fire(uri),
    500
  );
  protected override fireOnDidChangeMarkers(uri: URI): void {
    this.debouncedFireOnDidChangeMakers(uri);
  }
}
