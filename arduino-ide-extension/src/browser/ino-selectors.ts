import * as monaco from '@theia/monaco-editor-core';
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
