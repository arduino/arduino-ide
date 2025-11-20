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
import { parseEditsFromMultipleBlocks, EditOperation } from './chat-edits';
import { compactChatHistory, getHistoryStats } from './chat-history';
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

  constructor() {
    super();
    this.id = ChatWidget.ID;
    this.title.label = ChatWidget.LABEL;
    this.title.iconClass = 'chat-tab-icon';
    this.title.closable = false; // Make chat panel always visible
    this.addClass('chat-widget-container');
    // Set minimum width for better UX
    this.node.style.minWidth = '350px';
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

  protected override onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
  }

  protected override onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
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
- Do not include file headers, author banners, or boilerplate comment blocks.`;
    // Encourage structured edit output for agent-style fixes
    const editGuidance = `
When you intend the assistant to APPLY A FIX automatically, choose the simplest appropriate format:

FOR SIMPLE FIXES (missing values, single line changes, small corrections):
- Use a SINGLE code block with REPLACE-IN format containing ONLY the minimal change needed
- Example for missing variable values:
\`\`\`cpp
REPLACE-IN: sketchTest5.ino
FIND:
const int MEDIUM_THRESHOLD = ;  // Distance for 2 LEDs ON
const int CLOSE_THRESHOLD = ;   // Distance for 3 LEDs ON
REPLACE-WITH:
const int MEDIUM_THRESHOLD = 50;  // Distance for 2 LEDs ON
const int CLOSE_THRESHOLD = 20;   // Distance for 3 LEDs ON
\`\`\`
- Keep the FIND section as small as possible - only include the exact lines that need changing
- Do NOT include large code blocks in FIND/REPLACE-WITH unless absolutely necessary

FOR COMPLEX FIXES (multiple sections, refactoring, large changes):
- Use REPLACE-IN format with the specific sections that need changing
- Use FILE: format only when replacing an entire file

IMPORTANT RULES:
- Use ONLY ONE directive per code block (either FILE: OR REPLACE-IN:, never both)
- For simple fixes, use a SINGLE code block - do not split into multiple blocks
- Keep FIND sections minimal - only the exact text that needs to be found and replaced
- Do not include directive lines (FILE:, REPLACE-IN:, FIND:, REPLACE-WITH:) in the actual code content
- Do not mix unrelated files in the same fence; use multiple fences for multiple files
- When the fix is just missing values or simple corrections, make it ONE concise code block
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

  private handleInsertCode = async (code: string, messageId: string): Promise<void> => {
    try {
      const activeEditor = this.editorManager.currentEditor;
      if (!activeEditor) {
        this.addMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error: No active editor to insert code into.',
        });
        return;
      }

      const editor = activeEditor.editor;
      if (!(editor instanceof MonacoEditor)) {
        this.addMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error: Code insertion is only supported in Monaco editors.',
        });
        return;
      }

      const monacoEditor = editor.getControl();
      const textModel = monacoEditor.getModel();
      if (!textModel) {
        this.addMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error: Could not access editor model.',
        });
        return;
      }

      // Get current cursor position or selection
      const selections = monacoEditor.getSelections() || [];
      const selection = selections[0] || new monaco.Selection(1, 1, 1, 1);
      const position = selection.getEndPosition();
      
      // Insert code at cursor position
      const eol = textModel.getEOL();
      const textToInsert = code + eol;
      
      textModel.pushStackElement(); // Start a fresh operation
      textModel.pushEditOperations(
        selections,
        [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text: textToInsert,
            forceMoveMarkers: true,
          },
        ],
        () => selections
      );
      textModel.pushStackElement(); // Make it undoable
      
      // Move cursor after inserted code
      const lines = code.split('\n');
      const newLine = position.lineNumber + lines.length;
      const newColumn = lines.length > 0 ? lines[lines.length - 1].length + 1 : position.column;
      monacoEditor.setPosition({ lineNumber: newLine, column: newColumn });
      monacoEditor.revealLineInCenter(newLine);

      // Show success message
      this.addMessage({
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: '✅ Code inserted successfully!',
      });
    } catch (error) {
      this.addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error inserting code: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
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

      const editor = activeEditor.editor;
      if (!(editor instanceof MonacoEditor)) {
        this.addMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error: Fix application is only supported in Monaco editors.',
        });
        return;
      }

      const monacoEditor = editor.getControl();
      const textModel = monacoEditor.getModel();
      if (!textModel) {
        this.addMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error: Could not access editor model.',
        });
        return;
      }

      // Try to interpret the code as structured edits (agent mode)
      const candidateBlocks = [code];
      const edits: EditOperation[] = parseEditsFromMultipleBlocks(candidateBlocks);

      if (edits.length > 0) {
        // Determine base directory (sketch root)
        let baseDirUri: URI | undefined;
        try {
          const currentUriStr = activeEditor.editor.uri.toString();
          const sketch = await this.sketchesService.maybeLoadSketch(currentUriStr);
          if (sketch) {
            baseDirUri = new URI(sketch.uri);
          } else {
            baseDirUri = activeEditor.editor.uri.parent || undefined;
          }
        } catch {
          baseDirUri = activeEditor.editor.uri.parent || undefined;
        }

        for (const edit of edits) {
          const baseForRel =
            baseDirUri?.toString() ||
            (activeEditor.editor.uri.parent
              ? activeEditor.editor.uri.parent!.toString()
              : '');
          const targetUri =
            edit.filePath.startsWith('file:') || edit.filePath.startsWith('/')
              ? new URI(edit.filePath)
              : new URI(baseForRel.replace(/\/$/, '') + '/' + edit.filePath);

          if (edit.kind === 'overwrite') {
            await this.fileService.write(targetUri, edit.content);
          } else if (edit.kind === 'replace') {
            // Read, replace first occurrence, write back
            const original = await this.fileService.read(targetUri);
            const originalText = original.value;
            const idx = originalText.indexOf(edit.find);
            if (idx === -1) {
              // If not found, append a note to chat but continue
              this.addMessage({
                id: `warn-${Date.now()}`,
                role: 'assistant',
                content: `⚠️ Could not find target text in ${targetUri.path.base}; skipped replace.`,
              });
            } else {
              const updated =
                originalText.slice(0, idx) +
                edit.replaceWith +
                originalText.slice(idx + edit.find.length);
              await this.fileService.write(targetUri, updated);
            }
          }
        }
      } else {
        // Fallback: Replace current selection or insert at cursor in active file
        const selections = monacoEditor.getSelections() || [];
        const selection = selections[0] || new monaco.Selection(1, 1, 1, 1);
        const isSelectionEmpty =
          selection.startLineNumber === selection.endLineNumber &&
          selection.startColumn === selection.endColumn;

        const eol = textModel.getEOL();
        const textToInsert = code + eol;

        textModel.pushStackElement();
        textModel.pushEditOperations(
          selections,
          [
            {
              range: isSelectionEmpty
                ? new monaco.Range(
                    selection.endLineNumber,
                    selection.endColumn,
                    selection.endLineNumber,
                    selection.endColumn
                  )
                : new monaco.Range(
                    selection.startLineNumber,
                    selection.startColumn,
                    selection.endLineNumber,
                    selection.endColumn
                  ),
              text: textToInsert,
              forceMoveMarkers: true,
            },
          ],
          () => selections
        );
        textModel.pushStackElement();

        // Move cursor after applied fix
        const lines = code.split('\n');
        const newLine = isSelectionEmpty
          ? selection.endLineNumber + lines.length
          : selection.startLineNumber + lines.length;
        const newColumn =
          lines.length > 0 ? lines[lines.length - 1].length + 1 : selection.endColumn;
        monacoEditor.setPosition({ lineNumber: newLine, column: newColumn });
        monacoEditor.revealLineInCenter(newLine);
      }

      // Save file
      await activeEditor.editor.document.save();

      this.addMessage({
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: '⚡ Fix applied and file(s) saved.',
      });

      // Trigger Verify automatically (compile only)
      try {
        this.addMessage({
          id: `info-${Date.now()}`,
          role: 'assistant',
          content: '🛠️ Verifying the sketch...',
        });
        await this.commandService.executeCommand('arduino-verify-sketch');
      } catch (e) {
        // The verify command itself will surface errors in the Output; we only annotate the chat.
        this.addMessage({
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Verification failed to start: ${e instanceof Error ? e.message : String(e)}`,
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
            <button
              className="theia-button secondary chat-help-button"
              onClick={() => {
                this.showEditHelp = !this.showEditHelp;
                this.update();
              }}
              title={this.showEditHelp ? 'Hide edit formats' : 'Show edit formats'}
            >
              ❓
            </button>
            <button
              className="theia-button secondary chat-settings-button"
              onClick={this.handleOpenSettings}
              title="Settings"
            >
              ⚙️
            </button>
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
          <div className="chat-help callout">
            <div>
              <strong>Agent edit formats</strong> (used by “Apply Fix”):
            </div>
            <div style={{ marginTop: 6 }}>
              <div>1) Overwrite a file:</div>
              <pre>{`FILE: path/from/sketch-root.ino
<new full file content>`}</pre>
            </div>
            <div style={{ marginTop: 6 }}>
              <div>2) Replace within a file:</div>
              <pre>{`REPLACE-IN: path/from/sketch-root.ino
FIND:
<exact text to find>
REPLACE-WITH:
<replacement text>`}</pre>
            </div>
            <div style={{ marginTop: 6 }}>
              Return multiple fences to edit multiple files. Prefer REPLACE-IN for small changes.
            </div>
          </div>
        )}
        {this.showApiKeyDialog && (
          <div className="chat-settings-dialog">
            <div className="chat-settings-content">
              <h4>Gemini API Settings</h4>
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
              <div className="chat-settings-actions">
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
                        onClick={() => this.handleInsertCode(code, message.id)}
                        title="Insert this code into the active editor"
                      >
                        📋 Insert Code Block {codeIndex + 1}
                      </button>
                    ))}
                    {message.codeBlocks.length === 1 && (
                      <button
                        className="theia-button primary chat-apply-fix-button"
                        onClick={() => this.handleApplyFix(message.codeBlocks![0])}
                        title="Apply this fix directly (replaces selection or inserts at cursor)"
                      >
                        ⚡ Apply Fix
                      </button>
                    )}
                    {message.codeBlocks.length > 1 && (
                      <button
                        className="theia-button primary chat-apply-fix-button"
                        onClick={() => this.handleApplyFix(message.codeBlocks!.join('\n\n'))}
                        title="Apply all fixes directly (concatenated)"
                      >
                        ⚡ Apply All Fixes
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

