import { /*inject,*/ injectable } from 'inversify';
// import { remote } from 'electron';
// import { ArduinoMenus } from '../menu/arduino-menus';
import { SketchContribution, Command, CommandRegistry } from './contribution';
import { LibraryPackage } from '../../common/protocol';
// import { SaveAsSketch } from './save-as-sketch';
// import { EditorManager } from '@theia/editor/lib/browser';
// import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';

@injectable()
export class IncludeLibrary extends SketchContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(IncludeLibrary.Commands.INCLUDE_LIBRARY, {
            execute: async arg => {
                if (LibraryPackage.is(arg)) {
                    this.includeLibrary(arg);
                }
            }
        });
    }

    protected async includeLibrary(library: LibraryPackage): Promise<void> {
        // Always include to the main sketch file unless a c, cpp, or h file is the active one.
        console.log('INCLUDE', library);
    }

}

export namespace IncludeLibrary {
    export namespace Commands {
        export const INCLUDE_LIBRARY: Command = {
            id: 'arduino-include-library'
        };
    }
}
