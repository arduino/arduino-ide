/**
 * Multi-File Editing Agent
 * 
 * Coordinates changes across multiple files in a sketch.
 * Based on AGENT_ARCHITECTURE.md specifications.
 */

import { injectable, inject } from '@theia/core/shared/inversify';
import {
  Agent,
  AgentRequest,
  AgentContext,
  AgentResult,
  ValidationResult,
  UserRequest,
  Permission,
} from '../agent-types';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';
import { SketchesService } from '../../../../common/protocol/sketches-service';

/**
 * Parses code block directives for multi-file editing.
 * Supports both FILE: (overwrite) and REPLACE-IN: (targeted replace) formats.
 * Can handle multiple directives in a single block (separated by empty lines or new directives).
 */
function parseEditDirectives(block: string): Array<{
  kind: 'overwrite' | 'replace';
  filePath: string;
  content?: string;
  find?: string;
  replaceWith?: string;
}> {
  const edits: Array<{
    kind: 'overwrite' | 'replace';
    filePath: string;
    content?: string;
    find?: string;
    replaceWith?: string;
  }> = [];

  // Split block into sections by looking for new directives
  // A new directive starts with FILE: or REPLACE-IN: at the beginning of a line (after optional whitespace/empty lines)
  const sections: string[] = [];
  const lines = block.split('\n');
  let currentSection: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Check if this line starts a new directive
    const isNewDirective = /^(FILE:|REPLACE-IN:)/.test(trimmed);
    
    if (isNewDirective && currentSection.length > 0) {
      // Save current section and start a new one
      sections.push(currentSection.join('\n'));
      currentSection = [line];
    } else {
      currentSection.push(line);
    }
  }
  
  // Add the last section
  if (currentSection.length > 0) {
    sections.push(currentSection.join('\n'));
  }
  
  // If no sections were split, treat the whole block as one section
  if (sections.length === 0) {
    sections.push(block);
  }

  // Parse each section
  for (const section of sections) {
    const sectionLines = section.split('\n');
    if (sectionLines.length === 0) {
      continue;
    }

    // Check for REPLACE-IN directive (takes precedence)
    const replaceIndex = sectionLines.findIndex((l) => /^REPLACE-IN:\s*(.+)$/.test(l.trim()));
    if (replaceIndex >= 0) {
      const replaceMatch = /^REPLACE-IN:\s*(.+)$/.exec(sectionLines[replaceIndex].trim());
      if (replaceMatch) {
        let filePath = replaceMatch[1].trim().replace(/,\s*$/, '');
        
        const findIndex = sectionLines.findIndex((l, idx) => idx > replaceIndex && l.trim() === 'FIND:');
        const replaceWithIndex = sectionLines.findIndex((l, idx) => idx > findIndex && l.trim() === 'REPLACE-WITH:');
        
        if (findIndex >= 0 && replaceWithIndex > findIndex) {
          const findLines = sectionLines.slice(findIndex + 1, replaceWithIndex)
            .filter(line => {
              const trimmed = line.trim();
              return !/^(FILE:|REPLACE-IN:|FIND:|REPLACE-WITH:)/.test(trimmed);
            });
          const find = findLines.join('\n');
          
          const replaceWithLines = sectionLines.slice(replaceWithIndex + 1)
            .filter(line => {
              const trimmed = line.trim();
              return !/^(FILE:|REPLACE-IN:|FIND:|REPLACE-WITH:)/.test(trimmed);
            });
          const replaceWith = replaceWithLines.join('\n');
          
          edits.push({ kind: 'replace', filePath, find, replaceWith });
          continue;
        }
      }
    }

    // Check for FILE: directive (overwrite)
    const first = sectionLines[0].trim();
    const fileMatch = /^FILE:\s*(.+)$/.exec(first);
    if (fileMatch) {
      let filePath = fileMatch[1].trim().replace(/,\s*$/, '');
      
      const contentLines = sectionLines.slice(1).filter(line => {
        const trimmed = line.trim();
        return !/^(REPLACE-IN:|FIND:|REPLACE-WITH:)/.test(trimmed);
      });
      const content = contentLines.join('\n');
      
      if (content.trim().length > 0) {
        edits.push({ kind: 'overwrite', filePath, content });
      }
    }
  }

  return edits;
}

/**
 * Normalizes a file path by removing duplicate extensions.
 */
function normalizeFilePath(filePath: string): string {
  const extMatch = /^(.+?)(\.[^.]+)(\.[^.]+)$/.exec(filePath);
  if (extMatch && extMatch[2] === extMatch[3]) {
    return extMatch[1] + extMatch[2];
  }
  return filePath;
}

@injectable()
export class MultiFileEditingAgent implements Agent {
  id = 'multi-file-editing';
  name = 'Multi-File Editing Agent';
  description = 'Coordinates changes across multiple files in a sketch';
  capabilities = [
    'Refactor code across multiple files',
    'Add new files to sketch',
    'Update header files when implementations change',
    'Maintain consistency across files',
    'Handle file dependencies',
    'Overwrite entire files',
    'Targeted replacements in files',
  ];
  permissions = [Permission.MULTI_FILE_EDIT, Permission.SINGLE_FILE_EDIT];

  @inject(FileService)
  private readonly fileService: FileService;

  @inject(SketchesService)
  private readonly sketchesService: SketchesService;

  canHandle(request: UserRequest): boolean {
    // This agent can handle both single and multi-file edits
    const text = request.text;
    const lowerText = text.toLowerCase();
    
    // Check for structured edit directives
    if (text.includes('FILE:') || text.includes('REPLACE-IN:')) {
      return true;
    }
    
    // Check for multi-file operation keywords
    if (
      lowerText.includes('multiple files') ||
      lowerText.includes('across files') ||
      lowerText.includes('refactor') ||
      lowerText.includes('create file') ||
      lowerText.includes('new file')
    ) {
      return true;
    }
    
    // Also handle plain code blocks that look like full files or multi-file operations
    // (This is a fallback - InlineEditingAgent should handle simple insertions)
    const hasFileDirective = text.includes('FILE:');
    const hasMultipleCodeBlocks = (text.match(/```/g) || []).length >= 4; // Multiple code blocks
    
    if (hasFileDirective || hasMultipleCodeBlocks) {
      return true;
    }
    
    return false;
  }

  validate(request: AgentRequest): ValidationResult {
    const { parameters } = request;
    
    if (!parameters.text || typeof parameters.text !== 'string') {
      return {
        valid: false,
        errors: ['Missing or invalid text parameter'],
      };
    }

    // Parse edit directives
    const edits = parseEditDirectives(parameters.text);
    
    if (edits.length === 0) {
      return {
        valid: false,
        errors: ['No valid edit directives found (FILE: or REPLACE-IN:)'],
      };
    }

    // Validate each edit
    for (const edit of edits) {
      if (!edit.filePath) {
        return {
          valid: false,
          errors: ['Edit directive missing file path'],
        };
      }
      
      if (edit.kind === 'overwrite' && !edit.content) {
        return {
          valid: false,
          errors: ['FILE: directive missing content'],
        };
      }
      
      if (edit.kind === 'replace') {
        if (!edit.find) {
          return {
            valid: false,
            errors: ['REPLACE-IN: directive missing FIND section'],
          };
        }
        if (edit.replaceWith === undefined) {
          return {
            valid: false,
            errors: ['REPLACE-IN: directive missing REPLACE-WITH section'],
          };
        }
      }
    }

    return { valid: true };
  }

  async execute(request: AgentRequest, context: AgentContext): Promise<AgentResult> {
    try {
      const { parameters } = request;
      const codeBlock = parameters.text as string;

      // Parse all edit directives
      const edits = parseEditDirectives(codeBlock);
      
      if (edits.length === 0) {
        return {
          success: false,
          errors: ['No valid edit directives found'],
        };
      }

      // Determine base directory (sketch root)
      let baseDirUri: URI | undefined;
      try {
        if (context.sketchUri) {
          baseDirUri = new URI(context.sketchUri);
        } else if (context.activeFileUri) {
          const currentUriStr = context.activeFileUri;
          const sketch = await this.sketchesService.maybeLoadSketch(currentUriStr);
          if (sketch) {
            baseDirUri = new URI(sketch.uri);
          } else {
            baseDirUri = new URI(currentUriStr).parent;
          }
        }
      } catch {
        // Fallback handled below
      }

      if (!baseDirUri) {
        return {
          success: false,
          errors: ['Cannot determine sketch root directory'],
        };
      }

      // Apply all edits
      const results: Array<{ file: string; success: boolean; error?: string }> = [];
      
      for (const edit of edits) {
        try {
          const normalizedPath = normalizeFilePath(edit.filePath);
          const targetUri = normalizedPath.startsWith('file:') || normalizedPath.startsWith('/')
            ? new URI(normalizedPath)
            : baseDirUri.resolve(normalizedPath);

          if (edit.kind === 'overwrite') {
            await this.fileService.write(targetUri, edit.content!);
            results.push({ file: targetUri.path.base, success: true });
          } else if (edit.kind === 'replace') {
            const fileContent = await this.fileService.read(targetUri);
            const originalText = fileContent.value;
            const idx = originalText.indexOf(edit.find!);
            
            if (idx === -1) {
              results.push({
                file: targetUri.path.base,
                success: false,
                error: 'Could not find target text',
              });
            } else {
              const updated =
                originalText.slice(0, idx) +
                edit.replaceWith +
                originalText.slice(idx + edit.find!.length);
              await this.fileService.write(targetUri, updated);
              results.push({ file: targetUri.path.base, success: true });
            }
          }
        } catch (error) {
          results.push({
            file: edit.filePath,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      if (failureCount === 0) {
        return {
          success: true,
          message: `✅ Applied ${successCount} edit(s) to ${successCount} file(s)`,
          data: { results, filesEdited: successCount },
        };
      } else if (successCount > 0) {
        return {
          success: true,
          message: `⚠️ Applied ${successCount} edit(s), ${failureCount} failed`,
          errors: results.filter(r => !r.success).map(r => `${r.file}: ${r.error}`),
          data: { results, filesEdited: successCount, filesFailed: failureCount },
        };
      } else {
        return {
          success: false,
          errors: results.map(r => `${r.file}: ${r.error}`),
          data: { results },
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to execute multi-file edit'],
      };
    }
  }
}

