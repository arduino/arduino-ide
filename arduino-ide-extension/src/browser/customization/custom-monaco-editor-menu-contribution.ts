import { injectable } from "inversify";
import { MonacoEditorMenuContribution } from "@theia/monaco/lib/browser/monaco-menu";
import { MenuModelRegistry } from "@theia/core";

@injectable()
export class CustomMonacoEditorMenuContribution extends MonacoEditorMenuContribution {
    registerMenus(registry: MenuModelRegistry) {
        
    }
}