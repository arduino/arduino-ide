import { injectable } from 'inversify';
import { app } from 'electron';
import { fork } from 'child_process';
import { AddressInfo } from 'net';
import { ElectronSecurityToken } from '@theia/core/lib/electron-common/electron-token';
import { ElectronMainApplication as TheiaElectronMainApplication, TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/electron-main-application';

@injectable()
export class ElectronMainApplication extends TheiaElectronMainApplication {

    protected async getDefaultBrowserWindowOptions(): Promise<TheiaBrowserWindowOptions> {
        const options = await super.getDefaultBrowserWindowOptions();
        return {
            ...options,
            // Set and use a custom minimum window size: https://github.com/arduino/arduino-pro-ide/issues/337#issuecomment-687017281
            minWidth: 900,
            minHeight: 800
        };
    }

    protected async startBackend(): Promise<number> {
        // Check if we should run everything as one process.
        const noBackendFork = process.argv.indexOf('--no-cluster') !== -1;
        // We cannot use the `process.cwd()` as the application project path (the location of the `package.json` in other words)
        // in a bundled electron application because it depends on the way we start it. For instance, on OS X, these are a differences:
        // https://github.com/eclipse-theia/theia/issues/3297#issuecomment-439172274
        process.env.THEIA_APP_PROJECT_PATH = this.globals.THEIA_APP_PROJECT_PATH;
        // Set the electron version for both the dev and the production mode. (https://github.com/eclipse-theia/theia/issues/3254)
        // Otherwise, the forked backend processes will not know that they're serving the electron frontend.
        process.env.THEIA_ELECTRON_VERSION = process.versions.electron;
        if (noBackendFork) {
            process.env[ElectronSecurityToken] = JSON.stringify(this.electronSecurityToken);
            // The backend server main file is supposed to export a promise resolving with the port used by the http(s) server.
            const address: AddressInfo = await require(this.globals.THEIA_BACKEND_MAIN_PATH);
            return address.port;
        } else {
            let args = this.processArgv.getProcessArgvWithoutBin();
            // https://github.com/eclipse-theia/theia/issues/8227
            if (process.platform === 'darwin') {
                // https://github.com/electron/electron/issues/3657
                // https://stackoverflow.com/questions/10242115/os-x-strange-psn-command-line-parameter-when-launched-from-finder#comment102377986_10242200
                // macOS appends an extra `-psn_0_someNumber` arg if a file is opened from Finder after downloading from the Internet.
                // "AppName" is an app downloaded from the Internet. Are you sure you want to open it?
                args = args.filter(arg => !arg.startsWith('-psn'));
            }
            const backendProcess = fork(
                this.globals.THEIA_BACKEND_MAIN_PATH,
                args,
                await this.getForkOptions(),
            );
            return new Promise((resolve, reject) => {
                // The backend server main file is also supposed to send the resolved http(s) server port via IPC.
                backendProcess.on('message', (address: AddressInfo) => {
                    resolve(address.port);
                });
                backendProcess.on('error', error => {
                    reject(error);
                });
                app.on('quit', () => {
                    try {
                        // If we forked the process for the clusters, we need to manually terminate it.
                        // See: https://github.com/eclipse-theia/theia/issues/835
                        process.kill(backendProcess.pid);
                    } catch (e) {
                        if (e.code === 'ESRCH') {
                            console.log('Could not terminate the backend process. It was not running.');
                            return;
                        }
                        throw e;
                    }
                });
            });
        }
    }

}
