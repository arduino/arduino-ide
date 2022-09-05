import { injectable } from '@theia/core/shared/inversify';
import { SketchesError } from '../../common/protocol';
import {
  Command,
  CommandRegistry,
  SketchContribution,
  Sketch,
} from './contribution';

@injectable()
export class DeleteSketch extends SketchContribution {
  override registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(DeleteSketch.Commands.DELETE_SKETCH, {
      execute: (uri: string) => this.deleteSketch(uri),
    });
  }

  private async deleteSketch(uri: string): Promise<void> {
    const sketch = await this.loadSketch(uri);
    if (!sketch) {
      console.info(`Sketch not found at ${uri}. Skipping deletion.`);
      return;
    }
    return this.sketchService.deleteSketch(sketch);
  }

  private async loadSketch(uri: string): Promise<Sketch | undefined> {
    try {
      const sketch = await this.sketchService.loadSketch(uri);
      return sketch;
    } catch (err) {
      if (SketchesError.NotFound.is(err)) {
        return undefined;
      }
      throw err;
    }
  }
}
export namespace DeleteSketch {
  export namespace Commands {
    export const DELETE_SKETCH: Command = {
      id: 'arduino-delete-sketch',
    };
  }
}
