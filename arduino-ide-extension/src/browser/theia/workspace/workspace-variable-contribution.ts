import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { WorkspaceVariableContribution as TheiaWorkspaceVariableContribution } from '@theia/workspace/lib/browser/workspace-variable-contribution';
import { Sketch } from '../../../common/protocol';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../../common/protocol/sketches-service-client-impl';

@injectable()
export class WorkspaceVariableContribution extends TheiaWorkspaceVariableContribution {
  @inject(SketchesServiceClientImpl)
  protected readonly sketchesServiceClient: SketchesServiceClientImpl;

  protected currentSketch?: Sketch;

  @postConstruct()
  protected override init(): void {
    this.sketchesServiceClient.currentSketch().then((sketch) => {
      if (CurrentSketch.isValid(sketch)) {
        this.currentSketch = sketch;
      }
    });
  }

  override getResourceUri(): URI | undefined {
    const resourceUri = super.getResourceUri();
    // https://github.com/arduino/arduino-ide/issues/46
    // `currentWidget` can be an editor representing a file outside of the workspace. The current sketch should be a fallback.
    if (!resourceUri && this.currentSketch?.uri) {
      return new URI(this.currentSketch.uri);
    }
    return resourceUri;
  }
}
