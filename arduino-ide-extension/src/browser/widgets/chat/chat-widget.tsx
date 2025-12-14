import React from '@theia/core/shared/react';
import {
  injectable,
  inject,
  postConstruct,
} from '@theia/core/shared/inversify';
import {
  ReactWidget,
  Message,
} from '@theia/core/lib/browser/widgets';
import { nls } from '@theia/core/lib/common';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { ArduinoPreferences } from '../../arduino-preferences';
import { PreferenceService, PreferenceScope } from '@theia/core/lib/browser/preferences';
import { SketchesService } from '../../../common/protocol/sketches-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import * as monaco from '@theia/monaco-editor-core';
// @ts-expect-error see https://github.com/microsoft/TypeScript/issues/49721#issuecomment-1319854183
import type { Options } from 'react-markdown';
import { OutputChannelManager } from '../../theia/output/output-channel';
import { MonitorManagerProxyClient } from '../../../common/protocol/monitor-service';
import { CommandService } from '@theia/core/lib/common/command';
import {
  buildSketchContext,
  buildTerminalContext,
  buildIdeContext,
  extractExplicitCodeBlocks,
} from './chat-context';
import { BoardsServiceProvider } from '../../boards/boards-service-provider';
import { compactChatHistory, getHistoryStats } from './chat-history';
import { AgentRegistry } from './agent-registry';
import { UserRequest } from './agent-types';
import URI from '@theia/core/lib/common/uri';

const ReactMarkdown = React.lazy<React.ComponentType<Options>>(
  // @ts-expect-error see above
  () => import('react-markdown')
);

export const chatWidgetLabel = nls.localize(
  'arduino/chat/widgetLabel',
  'AI Chat'
);

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlocks?: string[]; // Extracted code blocks for insertion
}

@injectable()
export class ChatWidget extends ReactWidget {
  static readonly ID = 'arduino-chat-widget';
  static readonly LABEL = chatWidgetLabel;

  private messages: ChatMessage[] = [];
  private inputValue: string = '';
  private isProcessing: boolean = false;
  private messagesEndRef = React.createRef<HTMLDivElement>();
  private inputRef = React.createRef<HTMLTextAreaElement>();
  private showApiKeyDialog: boolean = false;
  private apiKeyInput: string = '';
  private showApiKey: boolean = false;
  private selectedModel: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-exp' | 'gemini-2.5-flash-lite' | 'gemini-2.5-flash-lite-exp' | 'gemini-2.0-flash' | 'gemini-2.0-flash-exp' | 'gemini-2.0-flash-lite' = 'gemini-2.0-flash-exp';
  // Keep a rolling buffer of serial monitor messages for context
  private serialMonitorBuffer: string[] = [];
  private static readonly SERIAL_BUFFER_MAX_CHARS = 8000;
  private showEditHelp: boolean = false;
  private hasBeenManuallyResized: boolean = false;
  private initialWidthSet: boolean = false;

  @inject(EditorManager)
  private readonly editorManager: EditorManager;

  @inject(ArduinoPreferences)
  private readonly preferences: ArduinoPreferences;

  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;

  @inject(SketchesService)
  private readonly sketchesService: SketchesService;

  @inject(FileService)
  private readonly fileService: FileService;

  @inject(OutputChannelManager)
  private readonly outputChannelManager: OutputChannelManager;

  @inject(MonitorManagerProxyClient)
  private readonly monitorManagerProxy: MonitorManagerProxyClient;

  @inject(CommandService)
  private readonly commandService: CommandService;

  @inject(BoardsServiceProvider)
  private readonly boardsServiceProvider: BoardsServiceProvider;

  @inject(AgentRegistry)
  private readonly agentRegistry: AgentRegistry;

  constructor() {
    super();
    this.id = ChatWidget.ID;
    this.title.label = ChatWidget.LABEL;
    this.title.iconClass = 'chat-tab-icon';
    this.title.closable = false; // Make chat panel always visible
    this.addClass('chat-widget-container');
    // Don't set fixed width here - let it be resizable
    // Only set initial width when first opened/activated
  }

  @postConstruct()
  protected init(): void {
    // Subscribe to serial monitor stream to maintain a lightweight rolling buffer for context
    this.toDispose.push(
      this.monitorManagerProxy.onMessagesReceived(({ messages }) => {
        this.serialMonitorBuffer.push(...messages);
        // Truncate buffer based on total chars
        let total = this.serialMonitorBuffer.reduce((acc, m) => acc + m.length, 0);
        if (total > ChatWidget.SERIAL_BUFFER_MAX_CHARS) {
          // Remove from the start until under the limit
          while (this.serialMonitorBuffer.length && total > ChatWidget.SERIAL_BUFFER_MAX_CHARS) {
            const removed = this.serialMonitorBuffer.shift() || '';
            total -= removed.length;
          }
        }
      })
    );
    // Check if API key is configured
    const apiKey = this.preferences['arduino.chat.geminiApiKey'];
    if (!apiKey) {
      this.addMessage({
        id: 'welcome',
        role: 'assistant',
        content: 'Welcome! Please configure your Gemini API key in the settings (click the gear icon) to start using the AI assistant.',
      });
    } else {
      this.addMessage({
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. How can I help you today?',
      });
    }
  }

  protected override onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    // Don't set fixed width here - allow resizing
  }

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
    // Set initial width only when first activated (user clicks on AI Chat or chat icon)
    if (!this.initialWidthSet && !this.hasBeenManuallyResized) {
      this.node.style.width = '420px';
      this.node.style.minWidth = '350px'; // Allow minimum resizing
      this.node.style.maxWidth = 'none'; // Allow maximum resizing
      this.initialWidthSet = true;
    }
  }

  protected override onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    // Set initial width only when first shown (user clicks on AI Chat or chat icon)
    if (!this.initialWidthSet && !this.hasBeenManuallyResized) {
      this.node.style.width = '420px';
      this.node.style.minWidth = '350px'; // Allow minimum resizing
      this.node.style.maxWidth = 'none'; // Allow maximum resizing
      this.initialWidthSet = true;
    }
    this.scrollToBottom();
  }

  private addMessage(message: Omit<ChatMessage, 'timestamp'>): void {
    this.messages.push({
      ...message,
      timestamp: new Date(),
    });
    this.update();
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesEndRef.current) {
        this.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  private handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    this.inputValue = event.target.value;
    // Update to refresh button disabled state, but use requestAnimationFrame to avoid caret jump
    requestAnimationFrame(() => {
      this.update();
    });
  };

  private handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleSend();
    }
  };

  private handleSend = async (): Promise<void> => {
    const currentText = (this.inputRef.current?.value ?? this.inputValue).trim();
    if (!currentText || this.isProcessing) {
      return;
    }

    const userMessage = currentText;
    // Clear the input box directly to avoid remount/caret issues
    this.inputValue = '';
    if (this.inputRef.current) {
      this.inputRef.current.value = '';
    }
    this.update(); // re-render to update send button disabled state and messages list

    // Add user message
    this.addMessage({
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
    });

    this.isProcessing = true;
    this.update();

    try {
      // Get full sketch context
      const sketchContext = await buildSketchContext(this.editorManager, this.sketchesService, this.fileService);

      // Call LLM API
      const response = await this.callLLM(userMessage, sketchContext);

      // Extract code blocks from response
      const codeBlocks = extractExplicitCodeBlocks(response);

      // Add assistant response
      // Always include codeBlocks array if any were found, even if empty after filtering
      // This ensures buttons appear when corrections are suggested
      this.addMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
      });
    } catch (error) {
      this.addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
      });
    } finally {
      this.isProcessing = false;
      this.update();
    }
  };

  /**
   * Collects recent output context from the IDE:
   * - Arduino Output channel (build/upload logs)
   * - Serial Monitor recent messages
   */
  private async getTerminalContext(): Promise<string | null> {
    const serialText =
      this.serialMonitorBuffer.length > 0 ? this.serialMonitorBuffer.join('') : undefined;
    return buildTerminalContext(this.outputChannelManager, serialText);
  }

  private async callLLM(message: string, context: string | null): Promise<string> {
    const apiKeyRaw = this.preferences['arduino.chat.geminiApiKey'];
    const apiKey = apiKeyRaw ? apiKeyRaw.trim() : '';
    const model = this.preferences['arduino.chat.geminiModel'] || 'gemini-2.0-flash-exp';

    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Please set it in the chat settings.');
    }

    // Build the system prompt
    const systemPrompt = `You are an expert development assistant with full understanding of the user's complete sketch and IDE state. Help users with:
- Writing and debugging Arduino code
- Code completion and generating missing code sections
- Explaining Arduino concepts and libraries
- Optimizing code for performance
- Troubleshooting hardware and software issues
- Best practices for embedded development
- Understanding the complete sketch structure and relationships between files

You have access to:
- The complete sketch including all files (.ino, .cpp, .h, etc.)
- Current IDE state (board connection status, selected port, recent errors)
- Serial monitor output and Arduino build/upload logs

IMPORTANT TROUBLESHOOTING TIP: When users encounter upload/flashing errors, the FIRST thing to suggest is pressing the RESET button on the Arduino board. This simple action resolves 99% of upload errors by resetting the board's bootloader state. Only suggest more complex solutions if the reset button doesn't work.

Use all available context to provide accurate, context-aware assistance and code completions.

When providing code:
- Use proper Arduino/C++ syntax
- Maintain consistency with the existing code style
- Consider all files in the sketch when making suggestions
- Provide complete, compilable code when asked to complete or generate code
- Keep comments inside the code minimal and essential only (e.g., non-obvious rationale or invariants). Do not add line-by-line or verbose explanatory comments.
- Prefer putting explanations outside the code block in plain text, not as comments inside the code.
- Do not include file headers, author banners, or boilerplate comment blocks.

IMPORTANT: When explaining errors or showing compiler output:
- DO NOT put error messages or compiler output in code blocks (triple-backtick cpp blocks)
- Instead, describe errors in plain text or use plain text formatting
- Only use code blocks (triple-backtick cpp) for ACTUAL CODE that should be inserted/applied
- If you need to show an error for context, describe it in text like: "The error shows 'undefined reference to functionX' at line 15"
- Code blocks should only contain fixable, actionable code - not error messages or diagnostic output`;
    // Encourage structured edit output for agent-style fixes
    const editGuidance = `
CRITICAL RULES FOR CODE CORRECTIONS:

1. NEVER PROVIDE FULL FILES - Only show the SPECIFIC LINES that need to change
2. NEVER DUPLICATE CODE - Each code block should be unique and minimal
3. USE REPLACE-IN format for ALL corrections - it shows only what changes

When providing corrections, you MUST use this format:

\`\`\`cpp
REPLACE-IN: filename.ino
FIND:
<exact existing code that needs to change - keep this MINIMAL, 1-5 lines max>
REPLACE-WITH:
<only the corrected version of those lines>
\`\`\`

EXAMPLE - Fixing missing values:
\`\`\`cpp
REPLACE-IN: sketchTest5.ino
FIND:
const int MEDIUM_THRESHOLD = ;
const int CLOSE_THRESHOLD = ;
REPLACE-WITH:
const int MEDIUM_THRESHOLD = 50;
const int CLOSE_THRESHOLD = 20;
\`\`\`

EXAMPLE - Removing duplicate code:
\`\`\`cpp
REPLACE-IN: hello.ino
FIND:
#include <Servo.h>
// ... (duplicate code block) ...
#include <Servo.h>
REPLACE-WITH:
#include <Servo.h>
\`\`\`

ABSOLUTE PROHIBITIONS:
- DO NOT provide entire file contents in code blocks
- DO NOT repeat the same code block multiple times
- DO NOT include code that doesn't need to change
- DO NOT use FILE: format unless explicitly replacing an entire file (almost never)
- DO NOT put function definitions AND their usage in the same correction block
- DO NOT include multiple #include statements for the same library

WHEN CLEANING CODE:
- Identify the EXACT duplicate or problematic section
- Show ONLY that section in FIND
- Show ONLY the cleaned version in REPLACE-WITH
- If there are multiple issues, use SEPARATE code blocks for each fix

REMEMBER: The user can see their current code. You only need to show what CHANGES, not what stays the same.
`;

    // Build messages array for Gemini
    const messages: Array<{ role: string; parts: Array<{ text: string }> }> = [
      {
        role: 'user',
        parts: [{ text: systemPrompt + '\n' + editGuidance }],
      },
    ];

    // Add chat history (excluding welcome messages and error messages)
    const historyMessages = this.messages.filter(
      msg => msg.id !== 'welcome' && 
             !msg.content.includes('Welcome') && 
             !msg.content.includes('Chat cleared') &&
             !(msg.role === 'assistant' && msg.content.startsWith('Error:'))
    );
    
    if (historyMessages.length > 0) {
      const compactedHistory = compactChatHistory(historyMessages);
      
      // Log stats for debugging (can be removed in production)
      const stats = getHistoryStats(historyMessages, compactedHistory);
      console.log('[Chat] History stats:', stats);
      
      // Add compacted history to messages
      messages.push(...compactedHistory);
    }

    // Add context if available
    if (context) {
      messages.push({
        role: 'user',
        parts: [{ text: `Current sketch code:\n\`\`\`cpp\n${context}\n\`\`\`` }],
      });
    }

    // Add terminal/output context if available
    const terminalContext = await this.getTerminalContext();
    if (terminalContext) {
      messages.push({
        role: 'user',
        parts: [{ text: `Recent IDE output for additional context (plain text, not code):\n${terminalContext}` }],
      });
    }

    // Add IDE state context (board connection, port, errors)
    const ideContext = await buildIdeContext(
      this.boardsServiceProvider,
      this.outputChannelManager
    );
    if (ideContext) {
      messages.push({
        role: 'user',
        parts: [{ text: ideContext }],
      });
    }

    // Add the user's message
    messages.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini API - encode API key properly in URL
    const encodedApiKey = encodeURIComponent(apiKey);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodedApiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192, // Increased for code completion
          },
        }),
      });

      if (!response.ok) {
        let errorMessage = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error.message || errorData.error.status || errorMessage;
            // Provide more helpful error messages
            if (response.status === 400) {
              errorMessage = `Invalid API request: ${errorMessage}. Please check your API key and model selection.`;
            } else if (response.status === 401 || response.status === 403) {
              errorMessage = `Authentication failed: ${errorMessage}. Please verify your API key is correct and has the necessary permissions.`;
            } else if (response.status === 404) {
              errorMessage = `Model not found: ${errorMessage}. The selected model may not be available.`;
            }
          }
        } catch (e) {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Unexpected response format from Gemini API');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to communicate with Gemini API');
    }
  }

  private handleClear = (): void => {
    this.messages = [];
    this.addMessage({
      id: 'welcome',
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
    });
  };

  private handleOpenSettings = (): void => {
    this.showApiKeyDialog = true;
    this.apiKeyInput = this.preferences['arduino.chat.geminiApiKey'] || '';
    this.selectedModel = (this.preferences['arduino.chat.geminiModel'] || 'gemini-2.0-flash-exp') as 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-exp' | 'gemini-2.5-flash-lite' | 'gemini-2.5-flash-lite-exp' | 'gemini-2.0-flash' | 'gemini-2.0-flash-exp' | 'gemini-2.0-flash-lite';
    this.showApiKey = false;
    this.update();
  };

  private handleCloseSettings = (): void => {
    this.showApiKeyDialog = false;
    this.update();
  };

  private handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.apiKeyInput = event.target.value;
    this.update();
  };

  private handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    this.selectedModel = event.target.value as 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-exp' | 'gemini-2.5-flash-lite' | 'gemini-2.5-flash-lite-exp' | 'gemini-2.0-flash' | 'gemini-2.0-flash-exp' | 'gemini-2.0-flash-lite';
    this.update();
  };

  private handleToggleApiKeyVisibility = (): void => {
    this.showApiKey = !this.showApiKey;
    this.update();
  };

  private handleSaveApiKey = async (): Promise<void> => {
    const trimmedApiKey = this.apiKeyInput.trim();
    await this.preferenceService.set('arduino.chat.geminiApiKey', trimmedApiKey, PreferenceScope.User);
    await this.preferenceService.set('arduino.chat.geminiModel', this.selectedModel, PreferenceScope.User);
    this.showApiKeyDialog = false;
    this.update();
  };

  // extraction moved to chat-context.ts (extractExplicitCodeBlocks)

  private handleViewCodeBlock = (messageId: string, codeIndex: number): void => {
    // Find the message element
    const messageElement = this.node.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) {
      return;
    }

    // Find all code blocks in this message
    const codeBlocks = messageElement.querySelectorAll('.chat-code-block-wrapper');
    if (codeBlocks.length > codeIndex) {
      const targetBlock = codeBlocks[codeIndex];
      targetBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  private handleApplyFix = async (code: string): Promise<void> => {
    try {
      const activeEditor = this.editorManager.currentEditor;
      if (!activeEditor) {
        this.addMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error: No active editor to apply the fix.',
        });
        return;
      }

      // Build agent context
      const currentUriStr = activeEditor.editor.uri.toString();
      const sketch = await this.sketchesService.maybeLoadSketch(currentUriStr);
      
      const editor = activeEditor.editor;
      let cursorPosition: { line: number; column: number } | undefined;
      let selection: { start: { line: number; column: number }; end: { line: number; column: number } } | undefined;
      
      if (editor instanceof MonacoEditor) {
        const monacoEditor = editor.getControl();
        const selections = monacoEditor.getSelections() || [];
        const sel = selections[0];
        if (sel) {
          const startPos = sel.getStartPosition();
          const endPos = sel.getEndPosition();
          cursorPosition = { line: startPos.lineNumber, column: startPos.column };
          if (!sel.isEmpty()) {
            selection = {
              start: { line: startPos.lineNumber, column: startPos.column },
              end: { line: endPos.lineNumber, column: endPos.column },
            };
          }
        }
      }

      const sketchFiles = sketch
        ? [
            sketch.mainFileUri,
            ...sketch.otherSketchFileUris,
            ...sketch.additionalFileUris,
          ]
        : undefined;

      const context = {
        sketchUri: sketch?.uri,
        activeFileUri: currentUriStr,
        cursorPosition,
        selection,
        sketchFiles,
      };

      // Create user request for agent
      const userRequest: UserRequest = {
        text: code,
        intent: 'apply-fix',
        context,
      };

      // Execute using agent registry
      const result = await this.agentRegistry.executeRequest(userRequest, context);

      if (result.success) {
        // Agents write files directly via FileService.write()
        // Theia detects this as an external file change and shows a reload dialog
        // To prevent the dialog, we sync ALL editor models immediately after the write
        // by reading files and updating models before Theia's file watcher triggers
        
        // Get list of files that were modified from the result
        const modifiedFiles: string[] = [];
        if (result.data?.filePath) {
          modifiedFiles.push(result.data.filePath);
        } else if (result.data?.filesEdited && result.data?.results) {
          // Multi-file edit - get all successfully edited files
          modifiedFiles.push(...result.data.results
            .filter((r: any) => r.success)
            .map((r: any) => {
              // Try to find the full URI from the file name
              if (context.sketchUri && r.file) {
                try {
                  const baseUri = new URI(context.sketchUri);
                  return baseUri.resolve(r.file).toString();
                } catch {
                  return r.file;
                }
              }
              return r.file;
            }));
        }
        
        // Sync all modified editors to prevent "file changed externally" dialogs
        // We need to update the editor models IMMEDIATELY after the write to prevent
        // Theia's file watcher from showing the dialog
        if (modifiedFiles.length > 0) {
          try {
            // Sync all files in parallel for speed - this must complete before Theia's watcher processes
            await Promise.all(
              modifiedFiles.map(async (fileUri) => {
                try {
                  const uri = fileUri.startsWith('file:') ? new URI(fileUri) : new URI(context.sketchUri || '').resolve(fileUri);
                  const editor = this.editorManager.all.find(e => e.editor.uri.toString() === uri.toString());
                  
                  if (editor && editor.editor instanceof MonacoEditor) {
                    const monacoEditor = editor.editor.getControl();
                    const model = monacoEditor.getModel();
                    
                    if (model) {
                      // Read the file that was just written
                      const fileContent = await this.fileService.read(uri);
                      const newContent = fileContent.value;
                      const currentContent = model.getValue();
                      
                      // Update model if different to sync with disk
                      if (newContent !== currentContent) {
                        // Store cursor/selection before update
                        const selection = monacoEditor.getSelection();
                        const cursorPosition = selection ? selection.getStartPosition() : undefined;
                        const selections = monacoEditor.getSelections() || [];
                        
                        // Use pushEditOperations to properly update the model
                        // This prevents Theia from showing the "file changed externally" dialog
                        model.pushStackElement();
                        model.pushEditOperations(
                          selections,
                          [
                            {
                              range: new monaco.Range(
                                1,
                                1,
                                model.getLineCount(),
                                model.getLineMaxColumn(model.getLineCount())
                              ),
                              text: newContent,
                              forceMoveMarkers: true,
                            },
                          ],
                          () => selections
                        );
                        model.pushStackElement();
                        
                        // Restore cursor position
                        if (cursorPosition) {
                          monacoEditor.setPosition(cursorPosition);
                        }
                      }
                    }
                  }
                } catch (fileSyncError) {
                  // Continue with other files if one fails
                  console.warn(`Failed to sync editor for ${fileUri}:`, fileSyncError);
                }
              })
            );
          } catch (syncError) {
            console.warn('Failed to sync editors after agent write:', syncError);
          }
        }

        // Note: We don't call save() here because agents already write files directly
        // The editor models are synced above to prevent dialogs

        this.addMessage({
          id: `success-${Date.now()}`,
          role: 'assistant',
          content: result.message || '⚡ Fix applied and file(s) saved.',
        });

        // Automatically check for missing libraries if code contains #include
        if (code.includes('#include')) {
          try {
            const libraryRequest: UserRequest = {
              text: 'check libraries',
              intent: 'check-and-install',
              context,
            };
            const libraryResult = await this.agentRegistry.executeRequest(libraryRequest, context);
            
            if (libraryResult.success && libraryResult.data?.librariesInstalled > 0) {
              this.addMessage({
                id: `library-${Date.now()}`,
                role: 'assistant',
                content: libraryResult.message || '✅ Libraries checked and installed',
              });
            } else if (libraryResult.success && libraryResult.data?.librariesChecked > 0) {
              // Libraries are already installed, no need to show message
            }
          } catch (e) {
            // Library check failed, but don't fail the whole operation
            console.warn('Library check failed:', e);
          }
        }

        // Trigger Verify automatically (compile only)
        let compilationSuccessful = false;
        try {
          this.addMessage({
            id: `info-${Date.now()}`,
            role: 'assistant',
            content: '🛠️ Verifying the sketch...',
          });
          await this.commandService.executeCommand('arduino-verify-sketch');
          compilationSuccessful = true;
        } catch (e) {
          // The verify command itself will surface errors in the Output; we only annotate the chat.
          this.addMessage({
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `Verification failed to start: ${e instanceof Error ? e.message : String(e)}`,
          });
        }

        // Run Code Analysis after fix to verify quality and check for issues
        // NOTE: This is NOT redundant with compilation. Here's why:
        // - Compilation checks: syntax errors, linker errors, missing includes
        // - Code Analysis checks: code quality, smells, patterns, optimizations, best practices
        // So code analysis adds value by catching quality issues that compilation doesn't catch
        if (compilationSuccessful) {
          try {
            const analysisRequest: UserRequest = {
              text: 'analyze code quality after fix',
              intent: 'code-analysis',
              context,
            };
            
            const analysisResult = await this.agentRegistry.executeRequest(analysisRequest, context);
            
            if (analysisResult.success && analysisResult.data) {
              const summary = analysisResult.data.summary;
              if (summary && (summary.errorCount > 0 || summary.warningCount > 0)) {
                // Only show message if there are issues to report
                const message = summary.errorCount > 0
                  ? `⚠️ Code analysis found ${summary.errorCount} error(s) and ${summary.warningCount} warning(s) after the fix.`
                  : `ℹ️ Code analysis found ${summary.warningCount} warning(s) after the fix.`;
                
                this.addMessage({
                  id: `analysis-${Date.now()}`,
                  role: 'assistant',
                  content: `${message} Review the suggestions below.`,
                });

                // Add suggestions if available
                if (analysisResult.suggestions && analysisResult.suggestions.length > 0) {
                  const suggestions = analysisResult.suggestions.slice(0, 3).join('\n- ');
                  this.addMessage({
                    id: `suggestions-${Date.now()}`,
                    role: 'assistant',
                    content: `💡 Suggestions:\n- ${suggestions}`,
                  });
                }
              }
              // If no issues found, silently pass (don't spam with "all good" messages)
            }
          } catch (e) {
            // Code analysis failed, but don't fail the whole operation
            console.warn('Code analysis after fix failed:', e);
            // Optionally, you could add a non-intrusive message here
          }
        }
      } else {
        // Show errors from agent
        const errorMessage = result.errors && result.errors.length > 0
          ? result.errors.join('\n')
          : 'Failed to apply fix';
        this.addMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${errorMessage}`,
        });
      }
    } catch (error) {
      this.addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error applying fix: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  protected render(): React.ReactElement {
    const apiKey = this.preferences['arduino.chat.geminiApiKey'];

    return (
      <div className="chat-widget">
        <div className="chat-header">
          <h3>{ChatWidget.LABEL}</h3>
          <div className="chat-header-actions">
            <div
              className="chat-info-icon"
              onClick={() => {
                this.showEditHelp = !this.showEditHelp;
                this.update();
              }}
              title={this.showEditHelp ? 'Hide edit formats' : 'Show edit formats'}
            >
              <span className="chat-info-letter">i</span>
            </div>
            <div
              className="chat-settings-icon"
              onClick={this.handleOpenSettings}
              title="Settings"
            >
              <span className="chat-settings-symbol">⚙</span>
            </div>
            <button
              className="theia-button secondary chat-clear-button"
              onClick={this.handleClear}
              title="Clear chat"
            >
              Clear
            </button>
          </div>
        </div>
        {this.showEditHelp && (
          <div className="chat-help-card">
            <div className="chat-help-card-header">
              <strong>Agent edit formats</strong> (used by "Update Code")
            </div>
            <div className="chat-help-card-content">
              <div className="chat-help-card-section">
                <div className="chat-help-card-label">1) Overwrite a file:</div>
                <pre className="chat-help-card-code">{`FILE: path/from/sketch-root.ino
<new full file content>`}</pre>
              </div>
              <div className="chat-help-card-section">
                <div className="chat-help-card-label">2) Replace within a file:</div>
                <pre className="chat-help-card-code">{`REPLACE-IN: path/from/sketch-root.ino
FIND:
<exact text to find>
REPLACE-WITH:
<replacement text>`}</pre>
              </div>
              <div className="chat-help-card-note">
                Return multiple fences to edit multiple files. Prefer REPLACE-IN for small changes.
              </div>
            </div>
          </div>
        )}
        {this.showApiKeyDialog && (
          <div className="chat-settings-dialog">
            <div className="chat-settings-card">
              <div className="chat-settings-card-header">
                <strong>Gemini API Settings</strong>
              </div>
              <div className="chat-settings-card-content">
              <div className="chat-settings-field">
                <label htmlFor="gemini-api-key">API Key:</label>
                <div className="chat-api-key-input-wrapper">
                  <input
                    id="gemini-api-key"
                    type={this.showApiKey ? 'text' : 'password'}
                    className="theia-input chat-api-key-input"
                    value={this.apiKeyInput}
                    onChange={this.handleApiKeyChange}
                    placeholder="Enter your Gemini API key"
                  />
                  <button
                    type="button"
                    className="chat-api-key-toggle"
                    onClick={this.handleToggleApiKeyVisibility}
                    title={this.showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {this.showApiKey ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-api-key-link"
                >
                  Get API key
                </a>
              </div>
              <div className="chat-settings-field">
                <label htmlFor="gemini-model">Model:</label>
                <select
                  id="gemini-model"
                  className="theia-select chat-model-select"
                  value={this.selectedModel}
                  onChange={this.handleModelChange}
                >
                  <optgroup label="Gemini 2.5 Series">
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Most Capable)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Balanced)</option>
                    <option value="gemini-2.5-flash-exp">Gemini 2.5 Flash Preview</option>
                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Fastest)</option>
                    <option value="gemini-2.5-flash-lite-exp">Gemini 2.5 Flash-Lite Preview</option>
                  </optgroup>
                  <optgroup label="Gemini 2.0 Series">
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash Preview</option>
                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</option>
                  </optgroup>
                </select>
              </div>
              <div className="chat-settings-card-actions">
                <button
                  className="theia-button primary"
                  onClick={this.handleSaveApiKey}
                >
                  Save
                </button>
                <button
                  className="theia-button secondary"
                  onClick={this.handleCloseSettings}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          </div>
        )}
        {!apiKey && !this.showApiKeyDialog && (
          <div className="chat-api-key-warning">
            <p>⚠️ Gemini API key not configured. Click the settings icon to add your API key.</p>
          </div>
        )}
        <div className="chat-messages">
          {this.messages.map((message) => (
            <div
              key={message.id}
              data-message-id={message.id}
              className={`chat-message chat-message-${message.role}`}
            >
              <div className="chat-message-header">
                <span className="chat-message-role">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </span>
                <span className="chat-message-time">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="chat-message-content">
                <React.Suspense
                  fallback={
                    <div className="chat-markdown-loading">
                      <div className="spinner" />
                    </div>
                  }
                >
                  <ReactMarkdown
                    components={{
                      code: ({ inline, className, children, ...props }) => {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => {
                        // Check if this is a code block (has a code child with className indicating language)
                        const codeElement = React.Children.toArray(children)[0] as React.ReactElement;
                        const isCodeBlock = codeElement && 
                          codeElement.props && 
                          codeElement.props.className && 
                          /language-/.test(codeElement.props.className);
                        
                        if (isCodeBlock) {
                          return (
                            <div className="chat-code-block-wrapper">
                              <pre className="chat-code-block">
                                {children}
                              </pre>
                            </div>
                          );
                        }
                        return <pre>{children}</pre>;
                      },
                      p: ({ children, ...props }) => {
                        // Filter out standalone FILE: or REPLACE-IN: lines that appear before code blocks
                        // These are often duplicates of what's inside the code block
                        const childArray = React.Children.toArray(children);
                        const filtered = childArray.filter((child) => {
                          if (typeof child === 'string') {
                            const trimmed = child.trim();
                            // Don't render standalone FILE: or REPLACE-IN: lines
                            if (/^(FILE:|REPLACE-IN:)\s*[^\s]+\s*$/.test(trimmed)) {
                              return false;
                            }
                          }
                          return true;
                        });
                        
                        if (filtered.length === 0) {
                          return null;
                        }
                        return <p {...props}>{filtered}</p>;
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </React.Suspense>
                {message.codeBlocks && message.codeBlocks.length > 0 && (
                  <div className="chat-code-insert-actions">
                    {message.codeBlocks.map((code, codeIndex) => (
                      <button
                        key={codeIndex}
                        className="theia-button secondary chat-insert-code-button"
                        onClick={() => this.handleViewCodeBlock(message.id, codeIndex)}
                        title="Scroll to this code block in the chat"
                      >
                        View Code Block {codeIndex + 1}
                      </button>
                    ))}
                    {message.codeBlocks.length === 1 && (
                      <button
                        className="theia-button primary chat-apply-fix-button"
                        onClick={() => this.handleApplyFix(message.codeBlocks![0])}
                        title="Apply this fix directly (replaces selection or inserts at cursor)"
                      >
                        Update Code
                      </button>
                    )}
                    {message.codeBlocks.length > 1 && (
                      <button
                        className="theia-button primary chat-apply-fix-button"
                        onClick={() => this.handleApplyFix(message.codeBlocks!.join('\n\n'))}
                        title="Apply all fixes directly (concatenated)"
                      >
                        Update All Code
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {this.isProcessing && (
            <div className="chat-message chat-message-assistant">
              <div className="chat-message-content">
                <span className="chat-typing-indicator">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={this.messagesEndRef} />
        </div>
        <div className="chat-input-container">
          <textarea
            className="chat-input"
            placeholder="Ask me anything about development..."
            ref={this.inputRef}
            defaultValue={this.inputValue}
            onChange={this.handleInputChange}
            onKeyDown={this.handleKeyDown}
            rows={3}
            disabled={this.isProcessing}
          />
          <button
            type="button"
            className="theia-button primary chat-send-button"
            onClick={this.handleSend}
            disabled={
              !(this.inputRef.current?.value ?? this.inputValue).trim() ||
              this.isProcessing ||
              !apiKey
            }
          >
            Send
          </button>
        </div>
      </div>
    );
  }
}

