import { ProgressMessage, ResponseService } from '../common/protocol/response-service';
import { DownloadProgress, TaskProgress } from './cli-protocol/cc/arduino/cli/commands/v1/common_pb';

export interface InstallResponse {
    getProgress?(): DownloadProgress | undefined;
    getTaskProgress(): TaskProgress | undefined;
}

export namespace InstallWithProgress {

    export interface Options {
        /**
         * _unknown_ progress if falsy.
         */
        readonly progressId?: string;
        readonly responseService: ResponseService;
    }

    export function createDataCallback({ responseService, progressId }: InstallWithProgress.Options): (response: InstallResponse) => void {
        let localFile = '';
        let localTotalSize = Number.NaN;
        return (response: InstallResponse) => {
            const download = response.getProgress ? response.getProgress() : undefined;
            const task = response.getTaskProgress();
            if (!download && !task) {
                throw new Error("Implementation error. Neither 'download' nor 'task' is available.");
            }
            if (task && download) {
                throw new Error("Implementation error. Both 'download' and 'task' are available.");
            }
            if (task) {
                const message = task.getName() || task.getMessage();
                if (message) {
                    if (progressId) {
                        responseService.reportProgress({ progressId, message, work: { done: Number.NaN, total: Number.NaN } });
                    }
                    responseService.appendToOutput({ chunk: `${message}\n` });
                }
            } else if (download) {
                if (download.getFile() && !localFile) {
                    localFile = download.getFile();
                }
                if (download.getTotalSize() > 0 && Number.isNaN(localTotalSize)) {
                    localTotalSize = download.getTotalSize();
                }

                // This happens only once per file download.
                if (download.getTotalSize() && localFile) {
                    responseService.appendToOutput({ chunk: `${localFile}\n` });
                }

                if (progressId && localFile) {
                    let work: ProgressMessage.Work | undefined = undefined;
                    if (download.getDownloaded() > 0 && !Number.isNaN(localTotalSize)) {
                        work = { total: localTotalSize, done: download.getDownloaded() };
                    }
                    responseService.reportProgress({ progressId, message: `Downloading ${localFile}`, work });
                }
                if (download.getCompleted()) {
                    // Discard local state.
                    if (progressId && !Number.isNaN(localTotalSize)) {
                        responseService.reportProgress({ progressId, message: '', work: { done: Number.NaN, total: Number.NaN } });
                    }
                    localFile = '';
                    localTotalSize = Number.NaN;
                }
            }
        };
    }

}

