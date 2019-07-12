import { injectable } from "inversify";
import { FileMenuContribution } from "@theia/workspace/lib/browser";
import { MenuModelRegistry } from "@theia/core";

@injectable()
export class CustomFileMenuContribution extends FileMenuContribution {
    registerMenus(registry: MenuModelRegistry) {
        
    }
}