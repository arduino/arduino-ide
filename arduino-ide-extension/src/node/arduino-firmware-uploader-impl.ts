import {
  ArduinoFirmwareUploader,
  FirmwareInfo,
} from '../common/protocol/arduino-firmware-uploader';
import { injectable, inject, named } from 'inversify';
import { ExecutableService, Port } from '../common/protocol';
import { getExecPath, spawnCommand } from './exec-util';
import { ILogger } from '@theia/core/lib/common/logger';
import { MonitorManager } from './monitor-manager';

@injectable()
export class ArduinoFirmwareUploaderImpl implements ArduinoFirmwareUploader {
  @inject(ExecutableService)
  protected executableService: ExecutableService;

  protected _execPath: string | undefined;

  @inject(ILogger)
  @named('fwuploader')
  protected readonly logger: ILogger;

  @inject(MonitorManager)
  protected readonly monitorManager: MonitorManager;

  protected onError(error: any): void {
    this.logger.error(error);
  }

  async getExecPath(): Promise<string> {
    if (this._execPath) {
      return this._execPath;
    }
    this._execPath = await getExecPath('arduino-fwuploader');
    return this._execPath;
  }

  async runCommand(args: string[]): Promise<any> {
    const execPath = await this.getExecPath();
    return await spawnCommand(`"${execPath}"`, args, this.onError.bind(this));
  }

  async uploadCertificates(command: string): Promise<any> {
    return await this.runCommand(['certificates', 'flash', command]);
  }

  async list(fqbn?: string): Promise<FirmwareInfo[]> {
    const fqbnFlag = fqbn ? ['--fqbn', fqbn] : [];
    const firmwares: FirmwareInfo[] =
      JSON.parse(
        await this.runCommand([
          'firmware',
          'list',
          ...fqbnFlag,
          '--format',
          'json',
        ])
      ) || [];
    return firmwares.reverse();
  }

  async updatableBoards(): Promise<string[]> {
    return (await this.list()).reduce(
      (a, b) => (a.includes(b.board_fqbn) ? a : [...a, b.board_fqbn]),
      [] as string[]
    );
  }

  async availableFirmwares(fqbn: string): Promise<FirmwareInfo[]> {
    return await this.list(fqbn);
  }

  async flash(firmware: FirmwareInfo, port: Port): Promise<string> {
    let output;
    const board = {
      name: firmware.board_name,
      fqbn: firmware.board_fqbn,
    }
    try {
      this.monitorManager.notifyUploadStarted(board, port);
      output = await this.runCommand([
        'firmware',
        'flash',
        '--fqbn',
        firmware.board_fqbn,
        '--address',
        port.address,
        '--module',
        `${firmware.module}@${firmware.firmware_version}`,
      ]);
    } catch (e) {
      throw e;
    } finally {
      this.monitorManager.notifyUploadFinished(board, port);
      return output;
    }
  }
}
