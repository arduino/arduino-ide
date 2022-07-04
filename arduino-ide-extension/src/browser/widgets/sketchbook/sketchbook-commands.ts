import { Command } from '@theia/core/lib/common/command';

export namespace SketchbookCommands {
  export const TOGGLE_SKETCHBOOK_WIDGET: Command = {
    id: 'arduino-sketchbook-widget:toggle',
  };

  export const REVEAL_SKETCH_NODE: Command = {
    id: 'arduino-sketchbook--reveal-sketch-node',
  };

  export const OPEN_NEW_WINDOW = Command.toLocalizedCommand(
    {
      id: 'arduino-sketchbook--open-sketch-new-window',
      label: 'Open Sketch in New Window',
    },
    'arduino/sketch/openSketchInNewWindow'
  );

  export const REVEAL_IN_FINDER = Command.toLocalizedCommand(
    {
      id: 'arduino-sketchbook--reveal-in-finder',
      label: 'Open Folder',
    },
    'arduino/sketch/openFolder'
  );

  export const OPEN_SKETCHBOOK_CONTEXT_MENU: Command = {
    id: 'arduino-sketchbook--open-sketch-context-menu',
    label: 'Contextual menu',
    iconClass: 'sketchbook-tree__opts',
  };

  export const SKETCHBOOK_HIDE_FILES: Command = {
    id: 'arduino-sketchbook--hide-files',
    label: 'Contextual menu',
  };

  export const SKETCHBOOK_SHOW_FILES: Command = {
    id: 'arduino-sketchbook--show-files',
    label: 'Contextual menu',
  };
}
