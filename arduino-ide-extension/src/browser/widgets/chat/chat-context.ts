import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { SketchesService } from '../../../common/protocol/sketches-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';
import { OutputChannelManager } from '../../theia/output/output-channel';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';

export async function buildSketchContext(
  editorManager: EditorManager,
  sketchesService: SketchesService,
  fileService: FileService
): Promise<string | null> {
  try {
    const activeEditor = editorManager.currentEditor;
    if (!activeEditor) {
      return null;
    }
    const currentUri = activeEditor.editor.uri.toString();
    const sketch = await sketchesService.maybeLoadSketch(currentUri);
    if (!sketch) {
      const document = activeEditor.editor.document;
      if (document) {
        return `Current file:\n\`\`\`cpp\n${document.getText()}\n\`\`\``;
      }
      return null;
    }
    const contextParts: string[] = [];
    try {
      const mainContent = await fileService.read(new URI(sketch.mainFileUri));
      contextParts.push(
        `Main sketch file (${new URI(sketch.mainFileUri).path.base}):\n\`\`\`cpp\n${mainContent.value}\n\`\`\``
      );
    } catch {
      // ignore read errors for main file
    }
    const allSketchFiles = [
      ...sketch.otherSketchFileUris,
      ...sketch.additionalFileUris,
    ];
    for (const fileUri of allSketchFiles) {
      try {
        const fileContent = await fileService.read(new URI(fileUri));
        const fileName = new URI(fileUri).path.base;
        const extension = fileName.substring(fileName.lastIndexOf('.'));
        let lang = 'cpp';
        if (extension === '.c') {
          lang = 'c';
        }
        contextParts.push(`File: ${fileName}\n\`\`\`${lang}\n${fileContent.value}\n\`\`\``);
      } catch {
        // ignore single file failures
      }
    }
    if (contextParts.length === 0) {
      return null;
    }
    return `Complete sketch context:\n\n${contextParts.join('\n\n')}`;
  } catch {
    const activeEditor = editorManager.currentEditor;
    if (activeEditor) {
      const document = activeEditor.editor.document;
      if (document) {
        return `Current file:\n\`\`\`cpp\n${document.getText()}\n\`\`\``;
      }
    }
    return null;
  }
}

export async function buildTerminalContext(
  outputChannelManager: OutputChannelManager,
  serialText: string | undefined
): Promise<string | null> {
  try {
    const sections: string[] = [];
    try {
      const arduinoOutput = await outputChannelManager.contentOfChannel('Arduino');
      if (arduinoOutput) {
        const tail = arduinoOutput.slice(-8000);
        sections.push(`Arduino Output (last 8000 chars):\n${tail}`);
      }
    } catch {
      // ignore output channel issues
    }
    if (serialText && serialText.length > 0) {
      sections.push(`Serial Monitor (recent):\n${serialText}`);
    }
    if (sections.length === 0) {
      return null;
    }
    return sections.join('\n\n');
  } catch {
    return null;
  }
}

/**
 * Checks if a code block appears to be an error message or compiler output
 * rather than actionable code.
 */
function isErrorOrOutputBlock(block: string): boolean {
  const blockLower = block.toLowerCase();
  
  // If block contains FILE: or REPLACE-IN: directives, it's actionable code, not an error
  if (block.includes('FILE:') || block.includes('REPLACE-IN:')) {
    return false;
  }
  
  // Common error indicators
  const errorIndicators = [
    /^error:/i,
    /^warning:/i,
    /^fatal error:/i,
    /compilation error/i,
    /build error/i,
    /upload error/i,
    /^\d+:\d+:\s*error/i,  // Line:column: error format
    /^\d+:\d+:\s*warning/i, // Line:column: warning format
    /undefined reference/i,
    /multiple definition/i,
    /redefinition/i,
    /no such file/i,
    /cannot find/i,
  ];
  
  // Check if block starts with or contains error patterns
  const hasErrorPattern = errorIndicators.some(pattern => pattern.test(block));
  
  // Check if block is mostly error-like (short, contains colons and numbers like line numbers)
  const isShortErrorFormat = block.split('\n').length <= 5 && 
    /^\d+:\d+/.test(block.trim()) &&
    (blockLower.includes('error') || blockLower.includes('warning'));
  
  // Check if it's compiler output (contains paths, compilation messages)
  // But be more careful - if it has actual code structure, it's not just output
  const hasCodeStructure = block.includes('{') || block.includes('}') || 
                           block.includes('void') || block.includes('int') ||
                           block.includes('setup') || block.includes('loop');
  const isCompilerOutput = !hasCodeStructure && (
    block.includes('In file included from') ||
    block.includes('compiling') ||
    block.includes('linking') ||
    (block.includes('sketch') && block.includes('.ino') && block.split('\n').length <= 3)
  );
  
  return hasErrorPattern || isShortErrorFormat || isCompilerOutput;
}

/**
 * Checks if a code block is likely a full file instead of a minimal correction.
 * Blocks with REPLACE-IN: directives are assumed to be corrections.
 */
function isLikelyFullFile(block: string): boolean {
  // If it has REPLACE-IN: directive, it's a correction, not a full file
  if (block.includes('REPLACE-IN:')) {
    return false;
  }
  
  // If it has FILE: directive, it's explicitly a full file (which is sometimes needed)
  if (block.includes('FILE:')) {
    return true;
  }
  
  // Check for signs of a full file vs correction:
  // - Very long blocks (>100 lines) without directives are likely full files
  const lines = block.split('\n').length;
  if (lines > 100) {
    return true;
  }
  
  // Blocks with multiple function definitions and no directives are likely full files
  const functionDefCount = (block.match(/^\s*(void|int|float|double|bool|char|String)\s+\w+\s*\(/gm) || []).length;
  if (functionDefCount >= 3 && !block.includes('REPLACE-IN:')) {
    return true;
  }
  
  return false;
}

/**
 * Normalizes a code block for comparison by removing whitespace differences
 */
function normalizeForComparison(block: string): string {
  return block
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Checks if two code blocks are essentially the same (duplicates)
 */
function areBlocksSimilar(block1: string, block2: string, threshold: number = 0.9): boolean {
  const normalized1 = normalizeForComparison(block1);
  const normalized2 = normalizeForComparison(block2);
  
  // Exact match
  if (normalized1 === normalized2) {
    return true;
  }
  
  // Check if one is contained in the other (common for duplicates)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const shorter = normalized1.length < normalized2.length ? normalized1 : normalized2;
    const longer = normalized1.length >= normalized2.length ? normalized1 : normalized2;
    // If shorter is more than 80% of longer, consider them duplicates
    if (shorter.length / longer.length > 0.8) {
      return true;
    }
  }
  
  return false;
}

export function extractExplicitCodeBlocks(content: string): string[] {
  const codeBlocks: string[] = [];
  const seenBlocks: string[] = []; // Track normalized blocks to detect duplicates
  // Match code blocks with optional language tag, handling both with and without newline after ```
  const codeBlockRegex = /```(?:cpp|c\+\+|c|arduino|ino|text|plain)?\n?([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match[1]) {
      let block = match[1].trim();
      
      // Skip empty blocks
      if (!block || block.length === 0) {
        continue;
      }
      
      // Skip error/output blocks - these are informational, not actionable
      // BUT: if block contains FILE: or REPLACE-IN:, it's actionable even if it looks like an error
      if (!block.includes('FILE:') && !block.includes('REPLACE-IN:') && isErrorOrOutputBlock(block)) {
        continue;
      }
      
      // Skip blocks that look like full files without directives (user wants corrections, not full files)
      // Only skip if it doesn't have REPLACE-IN: or FILE: directives
      if (!block.includes('REPLACE-IN:') && !block.includes('FILE:') && isLikelyFullFile(block)) {
        continue;
      }
      
      // Clean up duplicate FILE: or REPLACE-IN: directives that might appear at the start
      // Sometimes LLM includes "FILE: filename" both in markdown text and inside the code block
      // Remove standalone directive lines that are duplicates
      const lines = block.split('\n');
      if (lines.length > 1) {
        const firstLine = lines[0].trim();
        const secondLine = lines[1]?.trim();
        
        // If first line is FILE: or REPLACE-IN: and second line is also FILE: or REPLACE-IN: with same file, remove first
        if ((/^FILE:\s*(.+)$/.test(firstLine) || /^REPLACE-IN:\s*(.+)$/.test(firstLine)) &&
            (/^FILE:\s*(.+)$/.test(secondLine) || /^REPLACE-IN:\s*(.+)$/.test(secondLine))) {
          // Extract file paths
          const firstMatch = /^(FILE:|REPLACE-IN:)\s*(.+)$/.exec(firstLine);
          const secondMatch = /^(FILE:|REPLACE-IN:)\s*(.+)$/.exec(secondLine);
          if (firstMatch && secondMatch) {
            const firstPath = firstMatch[2].trim().replace(/,\s*$/, '');
            const secondPath = secondMatch[2].trim().replace(/,\s*$/, '');
            // If they're the same file, remove the first duplicate line
            if (firstPath === secondPath) {
              block = lines.slice(1).join('\n');
            }
          }
        }
      }
      
      // Detect if block contains repeated content (like the same code multiple times)
      // Split block into logical sections and check for duplicates within
      const blockLines = block.split('\n');
      if (blockLines.length > 20) {
        // Check if large portions are repeated
        const firstHalf = blockLines.slice(0, Math.floor(blockLines.length / 2)).join('\n');
        const secondHalf = blockLines.slice(Math.floor(blockLines.length / 2)).join('\n');
        // If first and second halves are very similar, it's likely duplicated content
        if (areBlocksSimilar(firstHalf, secondHalf, 0.7)) {
          // Keep only the first occurrence
          block = firstHalf;
        }
      }
      
      // Check for duplicates - skip if we've seen a similar block before
      const isDuplicate = seenBlocks.some(seen => areBlocksSimilar(block, seen));
      if (isDuplicate) {
        continue; // Skip duplicate blocks
      }
      seenBlocks.push(block);
      
      const prevBlock = codeBlocks.length > 0 ? codeBlocks[codeBlocks.length - 1] : '';
      
      // If previous block contains REPLACE-IN: or FILE: but doesn't have REPLACE-WITH: yet,
      // and this block starts with FIND: or REPLACE-WITH:, merge them
      const prevHasReplaceIn = prevBlock.includes('REPLACE-IN:') || prevBlock.includes('FILE:');
      const prevHasReplaceWith = prevBlock.includes('REPLACE-WITH:');
      const thisIsFindOrReplace = block.startsWith('FIND:') || block.startsWith('REPLACE-WITH:');
      
      if (prevHasReplaceIn && !prevHasReplaceWith && thisIsFindOrReplace) {
        // Merge: this block continues the previous REPLACE-IN operation
        codeBlocks[codeBlocks.length - 1] = prevBlock + '\n' + block;
      } else if (prevBlock.includes('FIND:') && !prevBlock.includes('REPLACE-WITH:') && block.startsWith('REPLACE-WITH:')) {
        // Merge: this block completes the previous FIND operation
        codeBlocks[codeBlocks.length - 1] = prevBlock + '\n' + block;
      } else {
        codeBlocks.push(block);
      }
    }
  }
  return codeBlocks;
}

/**
 * Build IDE context including board connection status, port information, and recent errors
 */
export async function buildIdeContext(
  boardsServiceProvider: BoardsServiceProvider,
  outputChannelManager: OutputChannelManager
): Promise<string | null> {
  try {
    const sections: string[] = [];
    const boardList = boardsServiceProvider.boardList;
    const { selectedBoard, selectedPort } = boardList.boardsConfig;
    
    // Board connection status
    if (selectedBoard) {
      const boardName = selectedBoard.name || selectedBoard.fqbn || 'Unknown board';
      sections.push(`Selected Board: ${boardName}`);
      if (selectedBoard.fqbn) {
        sections.push(`Board FQBN: ${selectedBoard.fqbn}`);
      }
      
      // Check if board is actually connected
      const selectedItem = boardList.items[boardList.selectedIndex];
      const isConnected = selectedItem !== undefined;
      
      if (selectedPort) {
        sections.push(`Selected Port: ${selectedPort.address}`);
        sections.push(`Port Protocol: ${selectedPort.protocol || 'serial'}`);
        
        if (isConnected) {
          sections.push(`Connection Status: ✅ Board is connected and detected on port ${selectedPort.address}`);
        } else {
          sections.push(`Connection Status: ⚠️ Board selected but not currently detected on port ${selectedPort.address}`);
          sections.push(`Note: The board may need to be plugged in or the port may have changed.`);
        }
      } else {
        sections.push(`Connection Status: ❌ No port selected`);
        sections.push(`Note: Please select a port from Tools > Port menu.`);
      }
    } else {
      sections.push(`Connection Status: ❌ No board selected`);
      sections.push(`Note: Please select a board from Tools > Board menu.`);
    }
    
    // Check for recent errors in Arduino output
    try {
      const arduinoOutput = await outputChannelManager.contentOfChannel('Arduino');
      if (arduinoOutput) {
        // Look for error patterns in the last 5000 characters
        const recentOutput = arduinoOutput.slice(-5000);
        const errorPatterns = [
          /error:/gi,
          /Error:/g,
          /ERROR:/g,
          /failed/gi,
          /Failed/gi,
          /FAILED/gi,
          /upload.*error/gi,
          /compile.*error/gi,
          /verification.*error/gi,
        ];
        
        const hasErrors = errorPatterns.some(pattern => {
          const regex = new RegExp(pattern.source, pattern.flags);
          return regex.test(recentOutput);
        });
        if (hasErrors) {
          // Extract error lines
          const lines = recentOutput.split('\n');
          const errorLines = lines
            .filter(line => 
              errorPatterns.some(pattern => {
                const regex = new RegExp(pattern.source, pattern.flags);
                return regex.test(line);
              })
            )
            .slice(-10); // Last 10 error lines
          
          if (errorLines.length > 0) {
            sections.push(`\nRecent Errors Detected:`);
            sections.push(`\`\`\``);
            sections.push(errorLines.join('\n'));
            sections.push(`\`\`\``);
            sections.push(`\n⚠️ Troubleshooting Tip: If you encounter upload/flashing errors, try pressing the RESET button on your Arduino board. This resolves the issue in 99% of cases by resetting the board's bootloader state.`);
          }
        }
      }
    } catch {
      // ignore output channel issues
    }
    
    if (sections.length === 0) {
      return null;
    }
    
    return `IDE Status and Configuration:\n${sections.join('\n')}`;
  } catch {
    return null;
  }
}


