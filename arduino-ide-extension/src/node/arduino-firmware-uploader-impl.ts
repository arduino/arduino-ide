import { ILogger } from '@theia/core/lib/common/logger';
import { inject, injectable, named } from '@theia/core/shared/inversify';
import type { Port } from '../common/protocol';
import {
  ArduinoFirmwareUploader,
  FirmwareInfo,
} from '../common/protocol/arduino-firmware-uploader';
import { getExecPath, spawnCommand } from './exec-util';
import { MonitorManager } from './monitor-manager';

@injectable()
export class ArduinoFirmwareUploaderImpl implements ArduinoFirmwareUploader {
  @inject(ILogger)
  @named('fwuploader')
  private readonly logger: ILogger;
  @inject(MonitorManager)
  private readonly monitorManager: MonitorManager;

  async uploadCertificates(command: string): Promise<string> {
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
    const board = {
      name: firmware.board_name,
      fqbn: firmware.board_fqbn,
    };
    try {
      await this.monitorManager.notifyUploadStarted(board.fqbn, port);
      const output = await this.runCommand([
        'firmware',
        'flash',
        '--fqbn',
        firmware.board_fqbn,
        '--address',
        port.address,
        '--module',
        `${firmware.module}@${firmware.firmware_version}`,
      ]);
      return output;
    } finally {
      await this.monitorManager.notifyUploadFinished(board.fqbn, port, port); // here the before and after ports are assumed to be always the same
    }
  }

  private onError(error: Error): void {
    this.logger.error(error);
  }

  private async runCommand(args: string[]): Promise<string> {
    const execPath = getExecPath('arduino-fwuploader');
    return await spawnCommand(execPath, args, this.onError.bind(this));
  }
}
