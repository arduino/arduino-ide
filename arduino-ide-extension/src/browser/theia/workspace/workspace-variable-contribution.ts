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
import { DisposableCollection } from '@theia/core/lib/common/disposable';

@injectable()
export class WorkspaceVariableContribution extends TheiaWorkspaceVariableContribution {
  @inject(SketchesServiceClientImpl)
  private readonly sketchesServiceClient: SketchesServiceClientImpl;

  private currentSketch?: Sketch;

  @postConstruct()
  protected override init(): void {
    const sketch = this.sketchesServiceClient.tryGetCurrentSketch();
    if (CurrentSketch.isValid(sketch)) {
      this.currentSketch = sketch;
    } else {
      const toDispose = new DisposableCollection();
      toDispose.push(
        this.sketchesServiceClient.onCurrentSketchDidChange((sketch) => {
          if (CurrentSketch.isValid(sketch)) {
            this.currentSketch = sketch;
          }
          toDispose.dispose();
        })
      );
    }
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
