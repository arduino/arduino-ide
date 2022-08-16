import * as os from 'os';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { MaybePromise } from '@theia/core/lib/common/types';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { constants, promises as fs } from 'fs';
import { join } from 'path';
import { ConfigService } from '../common/protocol';
import { Formatter, FormatterOptions } from '../common/protocol/formatter';
import { getExecPath, spawnCommand } from './exec-util';

@injectable()
export class ClangFormatter implements Formatter {
  @inject(ConfigService)
  private readonly configService: ConfigService;

  @inject(EnvVariablesServer)
  private readonly envVariableServer: EnvVariablesServer;

  async format({
    content,
    formatterConfigFolderUris,
    options,
  }: {
    content: string;
    formatterConfigFolderUris: string[];
    options?: FormatterOptions;
  }): Promise<string> {
    const [execPath, style] = await Promise.all([
      this.execPath(),
      this.style(formatterConfigFolderUris, options),
    ]);
    const formatted = await spawnCommand(
      `"${execPath}"`,
      [style],
      console.error,
      content
    );
    return formatted;
  }

  private _execPath: string | undefined;
  private async execPath(): Promise<string> {
    if (this._execPath) {
      return this._execPath;
    }
    this._execPath = await getExecPath('clang-format');
    return this._execPath;
  }

  /**
   * Calculates the `-style` flag for the formatter. Uses a `.clang-format` file if exists.
   * Otherwise, falls back to the default config.
   *
   * Style precedence:
   *  1. in the sketch folder,
   *  1. `~/.arduinoIDE/.clang-format`,
   *  1. `directories#data/.clang-format`, and
   *  1. default style flag as a string.
   *
   * See: https://github.com/arduino/arduino-ide/issues/566
   */
  private async style(
    formatterConfigFolderUris: string[],
    options?: FormatterOptions
  ): Promise<string> {
    const clangFormatPaths = await Promise.all([
      ...formatterConfigFolderUris.map((uri) => this.clangConfigPath(uri)),
      this.clangConfigPath(this.configDirPath()),
      this.clangConfigPath(this.dataDirPath()),
    ]);
    const first = clangFormatPaths.filter(Boolean).shift();
    if (first) {
      console.debug(
        `Using ${ClangFormatFile} style configuration from '${first}'.`
      );
      return `-style=file:"${first}"`;
    }
    return `-style="${style(toClangOptions(options))}"`;
  }

  private async dataDirPath(): Promise<string> {
    const { dataDirUri } = await this.configService.getConfiguration();
    return FileUri.fsPath(dataDirUri);
  }

  private async configDirPath(): Promise<string> {
    const configDirUri = await this.envVariableServer.getConfigDirUri();
    return FileUri.fsPath(configDirUri);
  }

  private async clangConfigPath(
    folderUri: MaybePromise<string>
  ): Promise<string | undefined> {
    const folderPath = FileUri.fsPath(await folderUri);
    const clangFormatPath = join(folderPath, ClangFormatFile);
    try {
      await fs.access(clangFormatPath, constants.R_OK);
      return clangFormatPath;
    } catch {
      return undefined;
    }
  }
}

interface ClangFormatOptions {
  readonly UseTab: 'Never' | 'ForIndentation';
  readonly TabWidth: number;
}

const ClangFormatFile = '.clang-format';

function toClangOptions(
  options?: FormatterOptions | undefined
): ClangFormatOptions {
  if (!!options) {
    return {
      UseTab: options.insertSpaces ? 'Never' : 'ForIndentation',
      TabWidth: options.tabSize,
    };
  }
  return { UseTab: 'Never', TabWidth: 2 };
}

export function style({ TabWidth, UseTab }: ClangFormatOptions): string {
  let styleArgument = JSON.stringify(styleJson({ TabWidth, UseTab })).replace(
    /[\\"]/g,
    '\\$&'
  );
  if (os.platform() === 'win32') {
    // Windows command interpreter does not use backslash escapes. This causes the argument to have alternate quoted and
    // unquoted sections.
    // Special characters in the unquoted sections must be caret escaped.
    const styleArgumentSplit = styleArgument.split('"');
    for (let i = 1; i < styleArgumentSplit.length; i += 2) {
      styleArgumentSplit[i] = styleArgumentSplit[i].replace(/[<>^|]/g, '^$&');
    }

    styleArgument = styleArgumentSplit.join('"');
  }

  return styleArgument;
}

function styleJson({
  TabWidth,
  UseTab,
}: ClangFormatOptions): Record<string, unknown> {
  // Source: https://github.com/arduino/tooling-project-assets/tree/main/other/clang-format-configuration
  const defaultConfig = require('../../src/node/default-formatter-config.json');
  return {
    ...defaultConfig,
    TabWidth,
    UseTab,
  };
}
