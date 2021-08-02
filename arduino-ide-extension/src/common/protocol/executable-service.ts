export const ExecutableServicePath = '/services/executable-service';
export const ExecutableService = Symbol('ExecutableService');
export interface ExecutableService {
  list(): Promise<{
    clangdUri: string;
    cliUri: string;
    lsUri: string;
    fwuploaderUri: string;
  }>;
}
