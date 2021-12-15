import { injectable } from "@theia/core/shared/inversify";
import { Emitter } from "@theia/core/shared/vscode-languageserver-protocol";
import { AllPublishOptions } from "builder-util-runtime";
import {
    AppUpdater,
    AppImageUpdater,
    MacUpdater,
    NsisUpdater,
    UpdateInfo,
    ProgressInfo,
    CancellationToken
} from "electron-updater";

// IDEUpdater TODO docs
@injectable()
export class IDEUpdater {
    private updater: AppUpdater;

    protected readonly checkingForUpdateEmitter = new Emitter<void>();
    protected readonly updateAvailableEmitter = new Emitter<UpdateInfo>();
    protected readonly updateNotAvailableEmitter = new Emitter<UpdateInfo>();
    protected readonly downloadProgressEmitter = new Emitter<ProgressInfo>();
    protected readonly downloadFinishedEmitter = new Emitter<UpdateInfo>();
    protected readonly errorEmitter = new Emitter<Error>();

    readonly onCheckingForUpdate = this.checkingForUpdateEmitter.event;
    readonly onUpdateAvailable = this.updateAvailableEmitter.event;
    readonly onUpdateNotAvailable = this.updateNotAvailableEmitter.event;
    readonly onDownloadProgressChanged = this.downloadProgressEmitter.event;
    readonly onDownloadFinished = this.downloadFinishedEmitter.event;
    readonly onError = this.errorEmitter.event;

    constructor() {
        const options: AllPublishOptions = {
            provider: "s3",
            bucket: "",
            region: "",
            acl: "public-read",
            endpoint: "https://{service}.{region}.amazonaws.com",
            channel: "",
        }
        // TODO: Search S3 bucket name for the two channels
        // https://downloads.arduino.cc/arduino-ide/arduino-ide_2.0.0-rc2_Linux_64bit.zip
        // https://downloads.arduino.cc/arduino-ide/nightly/arduino-ide_nightly-latest_Linux_64bit.zip

        if (process.platform === "win32") {
            this.updater = new NsisUpdater(options)
        } else if (process.platform === "darwin") {
            this.updater = new MacUpdater(options)
        } else {
            this.updater = new AppImageUpdater(options)
        }
        this.updater.autoDownload = false;

        this.updater.on("checking-for-update", this.checkingForUpdateEmitter.fire);
        this.updater.on("update-available", this.updateAvailableEmitter.fire);
        this.updater.on("update-not-available", this.updateNotAvailableEmitter.fire);
        this.updater.on("download-progress", this.downloadFinishedEmitter.fire);
        this.updater.on("update-downloaded", this.downloadFinishedEmitter.fire);
        this.updater.on("error", this.errorEmitter.fire);
    }

    checkForUpdates() {
        this.updater.checkForUpdates();
    }

    downloadUpdate(cancellationToken?: CancellationToken) {
        this.updater.downloadUpdate(cancellationToken);
    }

    quitAndInstall() {
        this.updater.quitAndInstall();
    }
}