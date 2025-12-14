/**
 * Inline Editing Agent
 * 
 * Handles small, targeted edits within a single file.
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
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';

/**
 * Parses code block directives for inline editing.
 * Supports REPLACE-IN format for targeted edits.
 */
function parseInlineEditDirective(block: string): {
  filePath?: string;
  find?: string;
  replaceWith?: string;
} | null {
  const lines = block.split('\n');
  if (lines.length === 0) {
    return null;
  }

  // Check for REPLACE-IN directive
  const replaceIndex = lines.findIndex((l) => /^REPLACE-IN:\s*(.+)$/.test(l.trim()));
  if (replaceIndex >= 0) {
    const replaceMatch = /^REPLACE-IN:\s*(.+)$/.exec(lines[replaceIndex].trim());
    if (replaceMatch) {
      let filePath = replaceMatch[1].trim().replace(/,\s*$/, '');
      
      const findIndex = lines.findIndex((l, idx) => idx > replaceIndex && l.trim() === 'FIND:');
      const replaceWithIndex = lines.findIndex((l, idx) => idx > findIndex && l.trim() === 'REPLACE-WITH:');
      
      if (findIndex >= 0 && replaceWithIndex > findIndex) {
        const findLines = lines.slice(findIndex + 1, replaceWithIndex)
          .filter(line => {
            const trimmed = line.trim();
            return !/^(FILE:|REPLACE-IN:|FIND:|REPLACE-WITH:)/.test(trimmed);
          });
        const find = findLines.join('\n');
        
        const replaceWithLines = lines.slice(replaceWithIndex + 1)
          .filter(line => {
            const trimmed = line.trim();
            return !/^(FILE:|REPLACE-IN:|FIND:|REPLACE-WITH:)/.test(trimmed);
          });
        const replaceWith = replaceWithLines.join('\n');
        
        return { filePath, find, replaceWith };
      }
    }
  }

  return null;
}

@injectable()
export class InlineEditingAgent implements Agent {
  id = 'inline-editing';
  name = 'Inline Editing Agent';
  description = 'Performs small, targeted edits within a single file';
  capabilities = [
    'Fix syntax errors',
    'Add missing values/variables',
    'Correct typos and simple mistakes',
    'Insert code snippets at cursor position',
    'Replace selected text',
  ];
  permissions = [Permission.SINGLE_FILE_EDIT];

  @inject(EditorManager)
  private readonly editorManager: EditorManager;

  @inject(FileService)
  private readonly fileService: FileService;

  canHandle(request: UserRequest): boolean {
    // This agent handles single-file edits with REPLACE-IN directives
    // or simple text insertions (including plain code blocks)
    const text = request.text;
    const lowerText = text.toLowerCase();
    
    // Check if it's a code block with REPLACE-IN directive
    if (text.includes('REPLACE-IN:')) {
      return true;
    }
    
    // Check if it's a simple code insertion request
    if (lowerText.includes('insert') || lowerText.includes('add') || lowerText.includes('fix')) {
      return true;
    }
    
    // Check if it looks like Arduino/C++ code (common patterns)
    // This makes it a fallback for plain code blocks
    const hasCodePatterns = 
      text.includes('void') ||
      text.includes('setup()') ||
      text.includes('loop()') ||
      text.includes('#include') ||
      text.includes('int ') ||
      text.includes('pinMode') ||
      text.includes('digitalWrite') ||
      text.includes('analogWrite') ||
      text.includes('Serial.') ||
      text.includes('{') && text.includes('}');
    
    // If it looks like code and we have an active file context, we can handle it
    if (hasCodePatterns && request.context?.activeFileUri) {
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

    // Check if it's a structured edit (REPLACE-IN format)
    const edit = parseInlineEditDirective(parameters.text);
    if (edit) {
      if (!edit.filePath) {
        return {
          valid: false,
          errors: ['REPLACE-IN directive missing file path'],
        };
      }
      if (!edit.find) {
        return {
          valid: false,
          errors: ['REPLACE-IN directive missing FIND section'],
        };
      }
      if (edit.replaceWith === undefined) {
        return {
          valid: false,
          errors: ['REPLACE-IN directive missing REPLACE-WITH section'],
        };
      }
    }

    // Plain code blocks are also valid (will be inserted at cursor)
    return { valid: true };
  }

  async execute(request: AgentRequest, context: AgentContext): Promise<AgentResult> {
    try {
      const { parameters } = request;
      const codeBlock = parameters.text as string;

      // Parse the edit directive
      const edit = parseInlineEditDirective(codeBlock);
      
      if (!edit || !edit.filePath || !edit.find || edit.replaceWith === undefined) {
        // Fallback: try to insert code at cursor
        return await this.insertCodeAtCursor(codeBlock, context);
      }

      // Apply structured edit - TypeScript now knows all properties are defined
      return await this.applyStructuredEdit(
        {
          filePath: edit.filePath,
          find: edit.find,
          replaceWith: edit.replaceWith,
        },
        context
      );
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async applyStructuredEdit(
    edit: { filePath: string; find: string; replaceWith: string },
    context: AgentContext
  ): Promise<AgentResult> {
    try {
      // Resolve file path
      let targetUri: URI;
      if (edit.filePath.startsWith('file:') || edit.filePath.startsWith('/')) {
        targetUri = new URI(edit.filePath);
      } else if (context.sketchUri) {
        const baseUri = new URI(context.sketchUri);
        targetUri = baseUri.resolve(edit.filePath);
      } else if (context.activeFileUri) {
        const baseUri = new URI(context.activeFileUri).parent;
        targetUri = baseUri.resolve(edit.filePath);
      } else {
        return {
          success: false,
          errors: ['Cannot resolve file path: no sketch or active file context'],
        };
      }

      // Read file
      const fileContent = await this.fileService.read(targetUri);
      const originalText = fileContent.value;

      // Find and replace
      const idx = originalText.indexOf(edit.find);
      if (idx === -1) {
        return {
          success: false,
          errors: [`Could not find target text in ${targetUri.path.base}`],
          suggestions: [
            'The exact text to find may not match. Check for whitespace differences.',
            'The code may have already been modified.',
          ],
        };
      }

      const updated = originalText.slice(0, idx) + edit.replaceWith + originalText.slice(idx + edit.find.length);

      // Write file
      await this.fileService.write(targetUri, updated);

      // Open file in editor if not already open
      const activeEditor = this.editorManager.currentEditor;
      if (!activeEditor || activeEditor.editor.uri.toString() !== targetUri.toString()) {
        await this.editorManager.open(targetUri);
      }

      return {
        success: true,
        message: `✅ Applied edit to ${targetUri.path.base}`,
        data: { filePath: targetUri.toString(), changes: 1 },
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to apply structured edit'],
      };
    }
  }

  /**
   * Intelligently merges new code with existing code, replacing duplicates instead of inserting.
   */
  private async insertCodeAtCursor(newCode: string, context: AgentContext): Promise<AgentResult> {
    try {
      const activeEditor = this.editorManager.currentEditor;
      if (!activeEditor) {
        return {
          success: false,
          errors: ['No active editor to insert code into'],
        };
      }

      const editor = activeEditor.editor;
      if (!(editor instanceof MonacoEditor)) {
        return {
          success: false,
          errors: ['Code insertion is only supported in Monaco editors'],
        };
      }

      const monacoEditor = editor.getControl();
      const textModel = monacoEditor.getModel();
      if (!textModel) {
        return {
          success: false,
          errors: ['Could not access editor model'],
        };
      }

      // Read existing file content
      const fileUri = editor.uri;
      const existingContent = await this.fileService.read(fileUri);
      const existingText = existingContent.value;

      // Intelligently merge the code
      const mergedCode = this.mergeCodeIntelligently(existingText, newCode);

      // Write merged code back to file
      await this.fileService.write(fileUri, mergedCode);

      // Reload the editor to show changes
      await editor.document.save();

      return {
        success: true,
        message: '✅ Code merged intelligently (duplicates replaced)',
        data: { merged: true },
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to merge code'],
      };
    }
  }

  /**
   * Intelligently merges new code with existing code by:
   * 1. Replacing duplicate functions (setup, loop, etc.)
   * 2. Merging includes (avoiding duplicates)
   * 3. Merging variable declarations (avoiding duplicates)
   * 4. Adding new code sections that don't exist
   */
  private mergeCodeIntelligently(existingCode: string, newCode: string): string {
    // Normalize line endings
    const existingLines = existingCode.split(/\r?\n/);
    const newLines = newCode.split(/\r?\n/);

    // Extract sections from existing code
    const existingIncludes = this.extractIncludes(existingLines);
    const existingFunctions = this.extractFunctions(existingLines);
    const existingVariables = this.extractVariableDeclarations(existingLines);
    const existingOtherCode = this.extractOtherCode(existingLines, existingIncludes, existingFunctions, existingVariables);

    // Extract sections from new code
    const newIncludes = this.extractIncludes(newLines);
    const newFunctions = this.extractFunctions(newLines);
    const newVariables = this.extractVariableDeclarations(newLines);
    const newOtherCode = this.extractOtherCode(newLines, newIncludes, newFunctions, newVariables);

    // Merge includes (avoid duplicates, keep order)
    const mergedIncludes = this.mergeIncludes(existingIncludes, newIncludes);

    // Merge variables (avoid duplicates, keep order)
    const mergedVariables = this.mergeVariables(existingVariables, newVariables);

    // Merge functions (replace existing ones with new ones)
    const mergedFunctions = this.mergeFunctions(existingFunctions, newFunctions);

    // Combine other code (existing first, then new)
    const mergedOtherCode = [...existingOtherCode, ...newOtherCode];

    // Build final code
    const result: string[] = [];

    // Add includes
    if (mergedIncludes.length > 0) {
      result.push(...mergedIncludes);
      result.push('');
    }

    // Add variables
    if (mergedVariables.length > 0) {
      result.push(...mergedVariables);
      result.push('');
    }

    // Add other code (before functions)
    if (mergedOtherCode.length > 0) {
      result.push(...mergedOtherCode);
      result.push('');
    }

    // Add functions (setup first, then loop, then others)
    const setupFunc = mergedFunctions.find(f => f.name === 'setup');
    const loopFunc = mergedFunctions.find(f => f.name === 'loop');
    const otherFuncs = mergedFunctions.filter(f => f.name !== 'setup' && f.name !== 'loop');

    if (setupFunc) {
      result.push(...setupFunc.lines);
      result.push('');
    }
    if (loopFunc) {
      result.push(...loopFunc.lines);
      result.push('');
    }
    if (otherFuncs.length > 0) {
      otherFuncs.forEach(func => {
        result.push(...func.lines);
        result.push('');
      });
    }

    // Remove trailing empty lines
    while (result.length > 0 && result[result.length - 1].trim() === '') {
      result.pop();
    }

    return result.join('\n') + (result.length > 0 ? '\n' : '');
  }

  private extractIncludes(lines: string[]): string[] {
    const includes: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#include')) {
        includes.push(line);
      }
    }
    return includes;
  }

  private extractFunctions(lines: string[]): Array<{ name: string; lines: string[] }> {
    const functions: Array<{ name: string; lines: string[] }> = [];
    let inFunction = false;
    let currentFunction: { name: string; lines: string[] } | null = null;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Detect function start (void setup(), void loop(), etc.)
      const funcMatch = /^\s*(void|int|float|double|bool|char|String)\s+(\w+)\s*\([^)]*\)\s*\{?\s*$/.exec(trimmed);
      if (funcMatch && !inFunction) {
        inFunction = true;
        currentFunction = {
          name: funcMatch[2],
          lines: [line],
        };
        braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        continue;
      }

      if (inFunction && currentFunction) {
        currentFunction.lines.push(line);
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;

        // Function ends when braces are balanced
        if (braceCount === 0 && trimmed.includes('}')) {
          functions.push(currentFunction);
          currentFunction = null;
          inFunction = false;
        }
      }
    }

    // Handle case where function doesn't end properly
    if (currentFunction) {
      functions.push(currentFunction);
    }

    return functions;
  }

  private extractVariableDeclarations(lines: string[]): string[] {
    const variables: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      // Match variable declarations (const int, int, float, etc.)
      if (/^\s*(const\s+)?(int|float|double|bool|char|String|byte|word|long|unsigned)\s+\w+/.test(trimmed) &&
          !trimmed.includes('(') && // Not a function
          !trimmed.includes('setup') && // Not setup/loop
          !trimmed.includes('loop')) {
        variables.push(line);
      }
    }
    return variables;
  }

  private extractOtherCode(
    lines: string[],
    includes: string[],
    functions: Array<{ name: string; lines: string[] }>,
    variables: string[]
  ): string[] {
    const otherCode: string[] = [];
    const functionLineSet = new Set<string>();
    
    // Mark all function lines by creating a set of line content
    functions.forEach(func => {
      func.lines.forEach(funcLine => {
        functionLineSet.add(funcLine);
      });
    });

    const includeSet = new Set(includes);
    const variableSet = new Set(variables);

    // Collect lines that aren't includes, variables, or function lines
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and standalone comments
      if (trimmed === '' || (trimmed.startsWith('//') && !trimmed.includes('code'))) {
        continue;
      }

      const isInclude = includeSet.has(line);
      const isVariable = variableSet.has(line);
      const isFunctionLine = functionLineSet.has(line);

      if (!isInclude && !isVariable && !isFunctionLine) {
        otherCode.push(line);
      }
    }

    return otherCode;
  }

  private mergeIncludes(existing: string[], newIncludes: string[]): string[] {
    const merged = [...existing];
    const existingSet = new Set(existing.map(inc => inc.trim().toLowerCase()));

    for (const inc of newIncludes) {
      const normalized = inc.trim().toLowerCase();
      if (!existingSet.has(normalized)) {
        merged.push(inc);
        existingSet.add(normalized);
      }
    }

    return merged;
  }

  private mergeVariables(existing: string[], newVars: string[]): string[] {
    const merged = [...existing];
    const existingNames = new Set(
      existing.map(v => {
        const match = /(\w+)\s*=/.exec(v.trim());
        return match ? match[1] : v.trim().split(/\s+/)[1] || '';
      })
    );

    for (const varDecl of newVars) {
      const match = /(\w+)\s*=/.exec(varDecl.trim());
      const varName = match ? match[1] : varDecl.trim().split(/\s+/)[1] || '';
      if (!existingNames.has(varName)) {
        merged.push(varDecl);
        existingNames.add(varName);
      }
    }

    return merged;
  }

  private mergeFunctions(
    existing: Array<{ name: string; lines: string[] }>,
    newFuncs: Array<{ name: string; lines: string[] }>
  ): Array<{ name: string; lines: string[] }> {
    const merged = [...existing];

    for (const newFunc of newFuncs) {
      const existingIndex = merged.findIndex(f => f.name === newFunc.name);
      if (existingIndex >= 0) {
        // Replace existing function
        merged[existingIndex] = newFunc;
      } else {
        // Add new function
        merged.push(newFunc);
      }
    }

    return merged;
  }
}

