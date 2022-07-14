import * as monaco from '@theia/monaco-editor-core';
import { OutputUri } from '@theia/output/lib/common/output-uri';
/**
 * Exclusive "ino" document selector for monaco.
 */
export const InoSelector = selectorOf('ino', 'c', 'cpp', 'h', 'hpp', 'pde');
function selectorOf(
  ...languageId: string[]
): monaco.languages.LanguageSelector {
  return languageId.map((language) => ({
    language,
    exclusive: true, // <-- this should make sure the custom formatter has higher precedence over the LS formatter.
  }));
}

/**
 * Selector for the `monaco` resource in the Arduino _Output_ channel.
 */
export const ArduinoOutputSelector: monaco.languages.LanguageSelector = {
  scheme: OutputUri.SCHEME,
  pattern: '**/Arduino',
};
