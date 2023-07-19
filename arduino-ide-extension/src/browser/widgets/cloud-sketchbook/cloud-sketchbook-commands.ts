import { TreeNode } from '@theia/core/lib/browser/tree';
import { Command } from '@theia/core/lib/common/command';
import { CloudSketchbookTreeModel } from './cloud-sketchbook-tree-model';

export namespace CloudSketchbookCommands {
  export interface Arg {
    model: CloudSketchbookTreeModel;
    node: TreeNode;
    event?: MouseEvent;
  }
  export namespace Arg {
    export function is(arg: unknown): arg is Arg {
      return (
        typeof arg === 'object' &&
        (<Arg>arg).model !== undefined &&
        (<Arg>arg).model instanceof CloudSketchbookTreeModel &&
        (<Arg>arg).node !== undefined &&
        TreeNode.is((<Arg>arg).node)
      );
    }
  }

  export const TOGGLE_CLOUD_SKETCHBOOK = Command.toLocalizedCommand(
    {
      id: 'arduino-cloud-sketchbook--disable',
      label: 'Show/Hide Cloud Sketchbook',
    },
    'arduino/cloud/showHideSketchbook'
  );

  export const PULL_SKETCH = Command.toLocalizedCommand(
    {
      id: 'arduino-cloud-sketchbook--pull-sketch',
      label: 'Pull Sketch',
      iconClass: 'fa fa-arduino-cloud-download',
    },
    'arduino/cloud/pullSketch'
  );

  export const PUSH_SKETCH = Command.toLocalizedCommand(
    {
      id: 'arduino-cloud-sketchbook--push-sketch',
      label: 'Push Sketch',
      iconClass: 'fa fa-arduino-cloud-upload',
    },
    'arduino/cloud/pullSketch'
  );

  export const PULL_SKETCH__TOOLBAR = {
    ...PULL_SKETCH,
    id: `${PULL_SKETCH.id}-toolbar`,
  };

  export const PUSH_SKETCH__TOOLBAR = {
    ...PUSH_SKETCH,
    id: `${PUSH_SKETCH.id}-toolbar`,
  };

  export const OPEN_IN_CLOUD_EDITOR = Command.toLocalizedCommand(
    {
      id: 'arduino-cloud-sketchbook--open-in-cloud-editor',
      label: 'Open in Cloud Editor',
    },
    'arduino/cloud/openInCloudEditor'
  );

  export const OPEN_SKETCHBOOKSYNC_CONTEXT_MENU = Command.toLocalizedCommand(
    {
      id: 'arduino-sketchbook-sync--open-sketch-context-menu',
      label: 'Options...',
      iconClass: 'sketchbook-tree__opts',
    },
    'arduino/cloud/options'
  );

  export const OPEN_SKETCH_SHARE_DIALOG = Command.toLocalizedCommand(
    {
      id: 'arduino-cloud-sketchbook--share-modal',
      label: 'Share...',
    },
    'arduino/cloud/share'
  );

  export const OPEN_PROFILE_CONTEXT_MENU: Command = {
    id: 'arduino-cloud-sketchbook--open-profile-menu',
    label: 'Contextual menu',
  };
}
