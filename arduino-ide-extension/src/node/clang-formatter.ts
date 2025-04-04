import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { MaybePromise } from '@theia/core/lib/common/types';
import { FileUri } from '@theia/core/lib/common/file-uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { constants, promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ConfigService } from '../common/protocol';
import { Formatter, FormatterOptions } from '../common/protocol/formatter';
import { spawnCommand } from './exec-util';
import { clangFormatPath } from './resources';
import defaultClangFormat from './default-formatter-config.json';

@injectable()
export class ClangFormatter implements Formatter {
  @inject(ConfigService)
  private readonly configService: ConfigService;

  @inject(EnvVariablesServer)
  private readonly envVariablesServer: EnvVariablesServer;

  async format({
    content,
    formatterConfigFolderUris,
    options,
  }: {
    content: string;
    formatterConfigFolderUris: string[];
    options?: FormatterOptions;
  }): Promise<string> {
    const execPath = this.execPath();
    const args = await this.styleArgs(formatterConfigFolderUris, options);
    const formatted = await spawnCommand(
      execPath,
      args,
      console.error,
      content
    );
    return formatted;
  }

  private execPath(): string {
    return clangFormatPath;
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
  private async styleArgs(
    formatterConfigFolderUris: string[],
    options?: FormatterOptions
  ): Promise<string[]> {
    const clangFormatPaths = await Promise.all([
      ...formatterConfigFolderUris.map((uri) => this.clangConfigPath(uri)),
      this.clangConfigPath(this.configDirPath()),
      this.clangConfigPath(this.dataDirPath()),
    ]);
    const first = clangFormatPaths.filter(Boolean).shift();
    if (first) {
      console.debug(
        `Using ${clangFormatFilename} style configuration from '${first}'.`
      );
      return ['-style', `file:${first}`];
    }
    return ['-style', style(toClangOptions(options))];
  }

  private async dataDirPath(): Promise<string | undefined> {
    const { config } = await this.configService.getConfiguration();
    if (!config?.dataDirUri) {
      return undefined;
    }
    return FileUri.fsPath(config.dataDirUri);
  }

  private async configDirPath(): Promise<string> {
    const configDirUri = await this.envVariablesServer.getConfigDirUri();
    return FileUri.fsPath(configDirUri);
  }

  private async clangConfigPath(
    folderUri: MaybePromise<string | undefined>
  ): Promise<string | undefined> {
    const uri = await folderUri;
    if (!uri) {
      return undefined;
    }
    const folderPath = FileUri.fsPath(uri);
    const clangFormatPath = join(folderPath, clangFormatFilename);
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

export const clangFormatFilename = '.clang-format';

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

function style({ TabWidth, UseTab }: ClangFormatOptions): string {
  return JSON.stringify(styleJson({ TabWidth, UseTab }));
}

function styleJson({
  TabWidth,
  UseTab,
}: ClangFormatOptions): Record<string, unknown> {
  return {
    // Source: https://github.com/arduino/tooling-project-assets/tree/main/other/clang-format-configuration
    ...defaultClangFormat,
    TabWidth,
    UseTab,
  };
}
