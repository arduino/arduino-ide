import { injectable } from "inversify";
import { SearchInWorkspaceFrontendContribution } from "@theia/search-in-workspace/lib/browser/search-in-workspace-frontend-contribution";
import { FrontendApplication } from "@theia/core/lib/browser";

@injectable()
export class SilentSearchInWorkspaceContribution extends SearchInWorkspaceFrontendContribution {
    async initializeLayout(app: FrontendApplication): Promise<void> {

    }
}