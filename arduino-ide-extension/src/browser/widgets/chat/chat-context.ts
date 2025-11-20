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

export function extractExplicitCodeBlocks(content: string): string[] {
  const codeBlocks: string[] = [];
  const codeBlockRegex = /```(?:cpp|c\+\+|c|arduino|ino)\n([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match[1]) {
      const block = match[1].trim();
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


