import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { promises as fs } from 'node:fs';
import {
  parse as parseJsonc,
  ParseError,
  printParseErrorCode,
} from 'jsonc-parser';
import { join } from 'node:path';
import { ErrnoException } from './utils/errors';

// Poor man's preferences on the backend. (https://github.com/arduino/arduino-ide/issues/1056#issuecomment-1153975064)
@injectable()
export class SettingsReader {
  @inject(EnvVariablesServer)
  private readonly envVariableServer: EnvVariablesServer;

  async read(): Promise<Record<string, unknown> | undefined> {
    const configDirUri = await this.envVariableServer.getConfigDirUri();
    const configDirPath = FileUri.fsPath(configDirUri);
    const settingsPath = join(configDirPath, 'settings.json');
    try {
      let raw = await fs.readFile(settingsPath, { encoding: 'utf8' });
      let rawJson = JSON.parse(raw);
      if (Object.keys(rawJson).length < 2) {
        raw =
          '{"window.titleBarStyle":"native","editor.fontSize":14,"workbench.colorTheme":"arduino-theme","files.autoSave":"afterDelay","editor.quickSuggestions":{"other":true,"comments":false,"strings":false},"arduino.window.autoScale":true,"window.zoomLevel":0,"arduino.compile.verbose":true,"arduino.compile.warnings":"None","arduino.upload.verbose":true,"arduino.upload.verify":false,"arduino.sketchbook.showAllFiles":false,"firstTime":true}';
        rawJson = JSON.parse(raw);
      }
      if (rawJson.firstTime === undefined || rawJson.firstTime === true) {
        rawJson.firstTime = false;
        rawJson['editor.quickSuggestions'].other = true;
        rawJson['arduino.compile.verbose'] = true;
        rawJson['arduino.upload.verbose'] = true;
        raw = JSON.stringify(rawJson);
        await fs.writeFile(settingsPath, raw, { encoding: 'utf8' });
      }
      return parse(raw);
    } catch (err) {
      if (ErrnoException.isENOENT(err)) {
        return undefined;
      }
    }
  }
}

export function parse(raw: string): Record<string, unknown> | undefined {
  const errors: ParseError[] = [];
  const settings =
    parseJsonc(raw, errors, {
      allowEmptyContent: true,
      allowTrailingComma: true,
      disallowComments: false,
    }) ?? {};
  if (errors.length) {
    console.error('Detected JSONC parser errors:');
    console.error('----- CONTENT START -----');
    console.error(raw);
    console.error('----- CONTENT END -----');
    errors.forEach(({ error, offset }) =>
      console.error(` - ${printParseErrorCode(error)} at ${offset}`)
    );
    return undefined;
  }
  return typeof settings === 'object' ? settings : undefined;
}
