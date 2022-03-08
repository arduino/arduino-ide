import {
  ArduinoFirmwareUploader,
  FirmwareInfo,
} from '../common/protocol/arduino-firmware-uploader';
import { injectable, inject, named } from '@theia/core/shared/inversify';
import { ExecutableService } from '../common/protocol';
import { SerialService } from '../common/protocol/serial-service';
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

  @inject(SerialService)
  protected readonly serialService: SerialService;

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

  async flash(firmware: FirmwareInfo, port: string): Promise<string> {
    let output;
    try {
      this.serialService.uploadInProgress = true;
      await this.serialService.disconnect();
      output = await this.runCommand([
        'firmware',
        'flash',
        '--fqbn',
        firmware.board_fqbn,
        '--address',
        port,
        '--module',
        `${firmware.module}@${firmware.firmware_version}`,
      ]);
    } catch (e) {
      throw e;
    } finally {
      this.serialService.uploadInProgress = false;
      this.serialService.connectSerialIfRequired();
      return output;
    }
  }
}
