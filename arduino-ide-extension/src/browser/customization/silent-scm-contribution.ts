import { injectable } from "inversify";
import { ScmContribution } from "@theia/scm/lib/browser/scm-contribution";
import { StatusBarEntry } from "@theia/core/lib/browser";

@injectable()
export class SilentScmContribution extends ScmContribution {

    async initializeLayout(): Promise<void> {
    }

    protected setStatusBarEntry(id: string, entry: StatusBarEntry): void {

    }
}