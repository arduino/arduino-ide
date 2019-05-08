export const WorkspaceServiceExtPath = '/services/workspace-service-ext';
export const WorkspaceServiceExt = Symbol('WorkspaceServiceExt');
export interface WorkspaceServiceExt {
    roots(): Promise<string[]>;
    /**
     * By default it is under `~/Arduino-PoC/workspace`.
     * It might not exist yet.
     */
    defaultWorkspaceUri(): Promise<string>;
    defaultDownloadsDirUri(): Promise<string>;
    defaultDataDirUri(): Promise<string>;
}
