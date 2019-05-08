export const WorkspaceServiceExtPath = '/services/workspace-service-ext';
export const WorkspaceServiceExt = Symbol('WorkspaceServiceExt');
export interface WorkspaceServiceExt {
    roots(): Promise<string[]>;
}
