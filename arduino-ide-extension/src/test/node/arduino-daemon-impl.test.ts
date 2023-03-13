import * as fs from 'node:fs';
import * as path from 'node:path';
import * as temp from 'temp';
import { expect } from 'chai';
import { ChildProcess } from 'node:child_process';
import { safeLoad, safeDump } from 'js-yaml';
import { ArduinoDaemonImpl } from '../../node/arduino-daemon-impl';
import { spawnCommand } from '../../node/exec-util';
import { CLI_CONFIG } from '../../node/cli-config';

const track = temp.track();

class SilentArduinoDaemonImpl extends ArduinoDaemonImpl {
  constructor(private logFormat: 'text' | 'json') {
    super();
  }

  override onData(data: string): void {
    // NOOP
  }

  override async spawnDaemonProcess(): Promise<{
    daemon: ChildProcess;
    port: string;
  }> {
    return super.spawnDaemonProcess();
  }

  protected override async getSpawnArgs(): Promise<string[]> {
    const cliConfigPath = await this.initCliConfig();
    return [
      'daemon',
      '--format',
      'jsonmini',
      '--port',
      '0',
      '--config-file',
      cliConfigPath,
      '-v',
      '--log-format',
      this.logFormat,
    ];
  }

  private async initCliConfig(): Promise<string> {
    const cliPath = await this.getExecPath();
    const destDir = track.mkdirSync();
    await spawnCommand(`"${cliPath}"`, [
      'config',
      'init',
      '--dest-dir',
      destDir,
    ]);
    const content = fs.readFileSync(path.join(destDir, CLI_CONFIG), {
      encoding: 'utf8',
    });
    const cliConfig = safeLoad(content) as any;
    // cliConfig.daemon.port = String(this.port);
    const modifiedContent = safeDump(cliConfig);
    fs.writeFileSync(path.join(destDir, CLI_CONFIG), modifiedContent, {
      encoding: 'utf8',
    });
    return path.join(destDir, CLI_CONFIG);
  }
}

describe('arduino-daemon-impl', () => {
  after(() => {
    track.cleanupSync();
  });

  it('should parse the port address when the log format is json', async () => {
    const { daemon, port } = await new SilentArduinoDaemonImpl(
      'json'
    ).spawnDaemonProcess();

    expect(port).not.to.be.undefined;
    expect(port).not.to.be.equal('0');
    daemon.kill();
  });

  it('should parse the port address when the log format is text', async () => {
    const { daemon, port } = await new SilentArduinoDaemonImpl(
      'text'
    ).spawnDaemonProcess();

    expect(port).not.to.be.undefined;
    expect(port).not.to.be.equal('0');
    daemon.kill();
  });
});
