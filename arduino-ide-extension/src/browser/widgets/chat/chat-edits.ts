export type EditOperation =
  | {
      kind: 'overwrite';
      filePath: string;
      content: string;
    }
  | {
      kind: 'replace';
      filePath: string;
      find: string;
      replaceWith: string;
    };

/**
 * Parses assistant code blocks to structured edit operations.
 *
 * Supported formats inside a single code block string:
 *
 * 1) Overwrite file:
 * FILE: path/to/file.ext
 * <new file content...>
 *
 * 2) Targeted replace:
 * REPLACE-IN: path/to/file.ext
 * FIND:
 * <literal text to find>
 * REPLACE-WITH:
 * <literal replacement text>
 *
 * Note: If both FILE: and REPLACE-IN: directives are present, REPLACE-IN: takes precedence
 * as it's more surgical. The FILE: directive will be ignored in this case.
 */
export function parseEditsFromCodeBlock(block: string): EditOperation[] {
  const lines = block.split('\n');
  if (lines.length === 0) {
    return [];
  }

  // First, check if there's a REPLACE-IN directive anywhere in the block
  // (REPLACE-IN takes precedence over FILE: as it's more surgical)
  const replaceIndex = lines.findIndex((l) => /^REPLACE-IN:\s*(.+)$/.test(l.trim()));
  if (replaceIndex >= 0) {
    const replaceMatch = /^REPLACE-IN:\s*(.+)$/.exec(lines[replaceIndex].trim());
    if (replaceMatch) {
      const filePath = replaceMatch[1].trim();
      const findIndex = lines.findIndex((l, idx) => idx > replaceIndex && l.trim() === 'FIND:');
      const replaceWithIndex = lines.findIndex((l, idx) => idx > findIndex && l.trim() === 'REPLACE-WITH:');
      if (findIndex >= 0 && replaceWithIndex > findIndex) {
        // Extract FIND content, stripping any directive lines that might have been mistakenly included
        const findLines = lines.slice(findIndex + 1, replaceWithIndex)
          .filter(line => {
            const trimmed = line.trim();
            // Remove directive lines from FIND section
            return !/^(FILE:|REPLACE-IN:|FIND:|REPLACE-WITH:)/.test(trimmed);
          });
        const find = findLines.join('\n');
        
        // Extract REPLACE-WITH content, stripping any directive lines
        const replaceWithLines = lines.slice(replaceWithIndex + 1)
          .filter(line => {
            const trimmed = line.trim();
            // Remove directive lines from REPLACE-WITH section
            return !/^(FILE:|REPLACE-IN:|FIND:|REPLACE-WITH:)/.test(trimmed);
          });
        const replaceWith = replaceWithLines.join('\n');
        
        return [{ kind: 'replace', filePath, find, replaceWith }];
      }
    }
  }

  // Check for FILE: directive (only if no REPLACE-IN was found)
  const first = lines[0].trim();
  const fileMatch = /^FILE:\s*(.+)$/.exec(first);
  if (fileMatch) {
    const filePath = fileMatch[1].trim();
    // Get content after FILE: line, but strip out any REPLACE-IN: directives that might be present
    const contentLines = lines.slice(1).filter(line => {
      const trimmed = line.trim();
      // Remove REPLACE-IN:, FIND:, REPLACE-WITH: directive lines
      return !/^(REPLACE-IN:|FIND:|REPLACE-WITH:)/.test(trimmed);
    });
    const content = contentLines.join('\n');
    // Only return overwrite if we have actual content (not just directives)
    if (content.trim().length > 0) {
      return [{ kind: 'overwrite', filePath, content }];
    }
  }

  return [];
}

export function parseEditsFromMultipleBlocks(blocks: string[]): EditOperation[] {
  const edits: EditOperation[] = [];
  for (const block of blocks) {
    edits.push(...parseEditsFromCodeBlock(block));
  }
  return edits;
}


