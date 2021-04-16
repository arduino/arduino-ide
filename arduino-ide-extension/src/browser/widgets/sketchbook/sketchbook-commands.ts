import { Command } from '@theia/core/lib/common/command';

export namespace SketchbookCommands {

    export const OPEN_NEW_WINDOW: Command = {
        id: 'arduino-sketchbook--open-sketch-new-window',
        label: 'Open Sketch in New Window',
    };

    export const REVEAL_IN_FINDER: Command = {
        id: 'arduino-sketchbook--reveal-in-finder',
        label: 'Open Folder',
    };

    export const OPEN_SKETCHBOOK_CONTEXT_MENU: Command = {
        id: 'arduino-sketchbook--open-sketch-context-menu',
        label: 'Contextual menu',
        iconClass: 'sketchbook-tree__opts'
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
