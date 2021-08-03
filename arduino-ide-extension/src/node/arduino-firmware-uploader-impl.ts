import {
  ArduinoFirmwareUploader,
  FirmwareInfo,
} from '../common/protocol/arduino-firmware-uploader';
import { injectable, inject, named } from 'inversify';
import { ExecutableService } from '../common/protocol';
import { getExecPath, spawnCommand } from './exec-util';
import { ILogger } from '@theia/core/lib/common/logger';

@injectable()
export class ArduinoFirmwareUploaderImpl implements ArduinoFirmwareUploader {
  @inject(ExecutableService)
  protected executableService: ExecutableService;

  protected _execPath: string | undefined;

  @inject(ILogger)
  @named('fwuploader')
  protected readonly logger: ILogger;

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
    const raw = await spawnCommand(
      `"${execPath}"`,
      args,
      this.onError.bind(this)
    );
    return JSON.parse(raw);
  }

  async list(fqbn?: string): Promise<FirmwareInfo[]> {
    const fqbnFlag = fqbn ? ['--fqbn', fqbn] : [];
    return await this.runCommand([
      'firmware',
      'list',
      '--format',
      'json',
      ...fqbnFlag,
    ]);
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

  async flash(firmware: FirmwareInfo, port: string): Promise<string> {
    return await this.runCommand([
      'firmware',
      'flash',
      '--fqbn',
      firmware.board_fqbn,
      '--address',
      port,
      '--module',
      `${firmware.module}@${firmware.firmware_version}`,
    ]);
  }
}
