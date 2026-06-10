import { injectable } from '@theia/core/shared/inversify';
import { TreeNode } from '@theia/core/lib/browser/tree';
import { SearchInWorkspaceResultTreeWidget as TheiaSearchInWorkspaceResultTreeWidget } from '@theia/search-in-workspace/lib/browser/search-in-workspace-result-tree-widget';

/**
 * Parses escape sequences in replacement string when regex mode is enabled.
 * Converts \n, \t, \r, \\ to actual characters.
 *
 * @param replaceString The raw replacement string with escape sequences
 * @returns The processed string with escape sequences converted to actual characters
 */
export function parseReplaceString(replaceString: string): string {
  let result = '';
  let i = 0;
  while (i < replaceString.length) {
    const char = replaceString[i];
    if (char === '\\' && i + 1 < replaceString.length) {
      const nextChar = replaceString[i + 1];
      switch (nextChar) {
        case 'n':
          result += '\n';
          i += 2;
          continue;
        case 't':
          result += '\t';
          i += 2;
          continue;
        case 'r':
          result += '\r';
          i += 2;
          continue;
        case '\\':
          result += '\\';
          i += 2;
          continue;
        default:
          result += char;
          i++;
          continue;
      }
    }
    result += char;
    i++;
  }
  return result;
}

@injectable()
export class SearchInWorkspaceResultTreeWidget extends TheiaSearchInWorkspaceResultTreeWidget {
  /**
   * Override replaceResult to parse escape sequences in replacement text
   * when regex mode is enabled. Fixes GitHub issue #2803.
   *
   * https://github.com/arduino/arduino-ide/issues/2803
   */
  protected override async replaceResult(
    node: TreeNode,
    replaceOne: boolean,
    replacementText: string
  ): Promise<void> {
    const processedText = this.searchOptions?.useRegExp
      ? parseReplaceString(replacementText)
      : replacementText;
    return super.replaceResult(node, replaceOne, processedText);
  }
}
