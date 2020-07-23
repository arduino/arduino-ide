export const FileSystemExtPath = '/services/file-system-ext';
export const FileSystemExt = Symbol('FileSystemExt');
export interface FileSystemExt {
    getUri(fsPath: string): Promise<string>;
}
