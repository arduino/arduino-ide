import { inject, injectable } from 'inversify';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { CommandHandler } from '@theia/core/lib/common/command';
import { QuickInputService } from '@theia/core/lib/browser/quick-open/quick-input-service';
import { ArduinoMenus } from '../menu/arduino-menus';
import { Contribution, Command, MenuModelRegistry, CommandRegistry, KeybindingRegistry } from './contribution';

@injectable()
export class Help extends Contribution {

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(WindowService)
    protected readonly windowService: WindowService;

    @inject(QuickInputService)
    protected readonly quickInputService: QuickInputService;

    registerCommands(registry: CommandRegistry): void {
        const open = (url: string) => this.windowService.openNewWindow(url, { external: true });
        const createOpenHandler = (url: string) => <CommandHandler>{
            execute: () => open(url)
        };
        registry.registerCommand(Help.Commands.GETTING_STARTED, createOpenHandler('https://www.arduino.cc/en/Guide'));
        registry.registerCommand(Help.Commands.ENVIRONMENT, createOpenHandler('https://www.arduino.cc/en/Guide/Environment'));
        registry.registerCommand(Help.Commands.TROUBLESHOOTING, createOpenHandler('https://support.arduino.cc/hc/en-us'));
        registry.registerCommand(Help.Commands.REFERENCE, createOpenHandler('https://www.arduino.cc/reference/en/'));
        registry.registerCommand(Help.Commands.FIND_IN_REFERENCE, {
            execute: async () => {
                let searchFor: string | undefined = undefined;
                const { currentEditor } = this.editorManager;
                if (currentEditor && currentEditor.editor instanceof MonacoEditor) {
                    const codeEditor = currentEditor.editor.getControl();
                    const selection = codeEditor.getSelection();
                    const model = codeEditor.getModel();
                    if (model && selection && !monaco.Range.isEmpty(selection)) {
                        searchFor = model.getValueInRange(selection);
                    }
                }
                if (!searchFor) {
                    searchFor = await this.quickInputService.open({
                        prompt: 'Search on Arduino.cc',
                        placeHolder: 'Type a keyword'
                    });
                }
                if (searchFor) {
                    return open(`https://www.arduino.cc/search?q=${encodeURIComponent(searchFor)}&tab=reference`);
                }
            }
        });
        registry.registerCommand(Help.Commands.FAQ, createOpenHandler('https://support.arduino.cc/hc/en-us'));
        registry.registerCommand(Help.Commands.VISIT_ARDUINO, createOpenHandler('https://www.arduino.cc/'));
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(ArduinoMenus.HELP__MAIN_GROUP, {
            commandId: Help.Commands.GETTING_STARTED.id,
            order: '0'
        });
        registry.registerMenuAction(ArduinoMenus.HELP__MAIN_GROUP, {
            commandId: Help.Commands.ENVIRONMENT.id,
            order: '1'
        });
        registry.registerMenuAction(ArduinoMenus.HELP__MAIN_GROUP, {
            commandId: Help.Commands.TROUBLESHOOTING.id,
            order: '2'
        });
        registry.registerMenuAction(ArduinoMenus.HELP__MAIN_GROUP, {
            commandId: Help.Commands.REFERENCE.id,
            order: '3'
        });

        registry.registerMenuAction(ArduinoMenus.HELP__FIND_GROUP, {
            commandId: Help.Commands.FIND_IN_REFERENCE.id,
            order: '4'
        });
        registry.registerMenuAction(ArduinoMenus.HELP__FIND_GROUP, {
            commandId: Help.Commands.FAQ.id,
            order: '5'
        });
        registry.registerMenuAction(ArduinoMenus.HELP__FIND_GROUP, {
            commandId: Help.Commands.VISIT_ARDUINO.id,
            order: '6'
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.registerKeybinding({
            command: Help.Commands.FIND_IN_REFERENCE.id,
            keybinding: 'CtrlCmd+Shift+F'
        });
    }

}

export namespace Help {
    export namespace Commands {
        export const GETTING_STARTED: Command = {
            id: 'arduino-getting-started',
            label: 'Getting Started',
            category: 'Arduino'
        };
        export const ENVIRONMENT: Command = {
            id: 'arduino-environment',
            label: 'Environment',
            category: 'Arduino'
        };
        export const TROUBLESHOOTING: Command = {
            id: 'arduino-troubleshooting',
            label: 'Troubleshooting',
            category: 'Arduino'
        };
        export const REFERENCE: Command = {
            id: 'arduino-reference',
            label: 'Reference',
            category: 'Arduino'
        };
        export const FIND_IN_REFERENCE: Command = {
            id: 'arduino-find-in-reference',
            label: 'Find in Reference',
            category: 'Arduino'
        };
        export const FAQ: Command = {
            id: 'arduino-faq',
            label: 'Frequently Asked Questions',
            category: 'Arduino'
        };
        export const VISIT_ARDUINO: Command = {
            id: 'arduino-visit-arduino',
            label: 'Visit Arduino.cc',
            category: 'Arduino'
        };
    }
}
