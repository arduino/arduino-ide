# Chat LLM Integration Guide

This document explains how the Chat UI LLM widget is integrated into the Arduino IDE and what changes might be needed in `arduino-cli` for agentic flows.

## Current Implementation

The Chat Widget has been added to the left sidebar of the IDE. It provides a basic chat interface where users can interact with an AI assistant.

### Files Created

1. **Chat Widget** (`arduino-ide-extension/src/browser/widgets/chat/chat-widget.tsx`)
   - Main React component for the chat UI
   - Handles message display, input, and basic LLM API calls
   - Currently has a placeholder LLM implementation

2. **Chat View Contribution** (`arduino-ide-extension/src/browser/widgets/chat/chat-view-contribution.tsx`)
   - Registers the widget in the sidebar
   - Handles widget lifecycle and commands

3. **Chat Icon** (`arduino-ide-extension/src/browser/icons/chat-tab-icon.svg`)
   - Sidebar icon for the chat widget

4. **Chat Styles** (`arduino-ide-extension/src/browser/style/chat.css`)
   - Styling for the chat interface

### Integration Points

The chat widget is registered in:
- `arduino-ide-extension/src/browser/arduino-ide-frontend-module.ts`

## LLM API Integration

### Current Status

The `callLLM` method in `chat-widget.tsx` is currently a placeholder. You need to implement the actual LLM API integration.

### Implementation Options

1. **Direct API Integration** (Recommended for simple use cases)
   - Add API calls directly in `chat-widget.tsx`
   - Examples: OpenAI, Anthropic, or local models via HTTP

2. **Backend Service** (Recommended for complex use cases)
   - Create a new backend service in `arduino-ide-extension/src/node/`
   - Expose via WebSocket (similar to `CoreService`)
   - Handle API keys and authentication securely

### Example: OpenAI Integration

```typescript
private async callLLM(message: string, context: string | null): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YOUR_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an Arduino development assistant. Help users with code, debugging, and best practices.',
        },
        ...(context ? [{
          role: 'system',
          content: `Current sketch context:\n\`\`\`cpp\n${context}\n\`\`\``,
        }] : []),
        {
          role: 'user',
          content: message,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

## Arduino CLI Integration for Agentic Flows

### When Do You Need CLI Changes?

You **DO NOT** need to modify `arduino-cli` for:
- Basic chat functionality
- Code suggestions and explanations
- General Arduino development questions

You **DO** need to modify `arduino-cli` for:
- **Agentic workflows** where the AI can:
  - Automatically compile code
  - Upload sketches to boards
  - Analyze compilation errors
  - Modify board configurations
  - Install libraries or boards
  - Execute any CLI commands programmatically

### Architecture for Agentic Flows

```
┌─────────────────┐
│   Chat Widget   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ User asks: "Compile and upload this code"
         │
         ▼
┌─────────────────┐
│  Chat Service   │
│   (Backend)     │
└────────┬────────┘
         │
         │ Calls CoreService
         │
         ▼
┌─────────────────┐
│  CoreService    │
│  (gRPC Client)  │
└────────┬────────┘
         │
         │ gRPC calls
         │
         ▼
┌─────────────────┐
│  arduino-cli    │
│   (Daemon)      │
└─────────────────┘
```

### Required CLI Extensions

If you want agentic flows, you'll need to extend `arduino-cli` with:

1. **New gRPC Services** (in `arduino-cli/rpc/cc/arduino/cli/commands/v1/`)
   - `ai_service.proto` - Define AI-specific RPC methods
   - Example methods:
     - `AnalyzeCode` - Analyze code for errors/suggestions
     - `GenerateCode` - Generate code from natural language
     - `ExplainError` - Explain compilation errors
     - `OptimizeCode` - Suggest optimizations

2. **Implementation** (in `arduino-cli/commands/`)
   - `ai.go` - Implement the AI service handlers
   - Integrate with LLM APIs
   - Use existing CLI functionality (compile, upload, etc.)

3. **Protocol Generation**
   - After modifying proto files, regenerate TypeScript bindings:
     ```bash
     cd arduino-ide-extension
     yarn generate-protocol
     ```

### Example: Agentic Compile Flow

**In arduino-cli (Go):**
```go
// commands/ai.go
func (s *ArduinoCoreService) CompileWithAI(
    ctx context.Context,
    req *CompileWithAIRequest,
) (*CompileWithAIResponse, error) {
    // 1. Compile the code
    compileResp, err := s.Compile(ctx, req.CompileRequest)
    if err != nil {
        // 2. If compilation fails, analyze errors with AI
        errorAnalysis := s.analyzeErrorsWithAI(compileResp.Errors)
        return &CompileWithAIResponse{
            CompileResponse: compileResp,
            ErrorAnalysis: errorAnalysis,
            Suggestions: s.generateFixSuggestions(errorAnalysis),
        }, nil
    }
    return &CompileWithAIResponse{
        CompileResponse: compileResp,
    }, nil
}
```

**In IDE (TypeScript):**
```typescript
// In chat-widget.tsx or a new chat-service.ts
private async handleAgenticRequest(userMessage: string): Promise<string> {
  // Parse user intent
  if (userMessage.includes('compile') || userMessage.includes('upload')) {
    // Call CoreService with AI enhancements
    const result = await this.coreService.compileWithAI({
      sketch: currentSketch,
      // ... other options
    });
    
    if (result.errorAnalysis) {
      return `Compilation failed. Here's what went wrong:\n${result.errorAnalysis}\n\nSuggestions:\n${result.suggestions}`;
    }
    return 'Compilation successful!';
  }
  // ... other agentic flows
}
```

## Setup Instructions

### 1. Basic Chat (No CLI Changes)

1. Implement the `callLLM` method in `chat-widget.tsx`
2. Add your LLM API key (consider using environment variables or preferences)
3. Test the chat interface

### 2. Agentic Flows (Requires CLI Changes)

1. **Fork and clone arduino-cli** (if not already done):
   ```bash
   cd ~/Documents/CognifyEV
   git clone https://github.com/YOUR_USERNAME/arduino-cli.git
   cd arduino-cli
   ```

2. **Add AI service proto file**:
   ```bash
   # Create: rpc/cc/arduino/cli/commands/v1/ai_service.proto
   # Define your RPC methods
   ```

3. **Implement handlers**:
   ```bash
   # Create: commands/ai.go
   # Implement the service methods
   ```

4. **Build and replace CLI**:
   ```bash
   go build -o arduino-cli ./cmd/arduino-cli
   cp arduino-cli ../embeddedIde/arduino-ide/arduino-ide-extension/src/node/resources/arduino-cli
   ```

5. **Regenerate protocol bindings**:
   ```bash
   cd ../embeddedIde/arduino-ide
   yarn --cwd ./arduino-ide-extension generate-protocol
   ```

6. **Update IDE to use new services**:
   - Add new service client in `arduino-core-service-client.ts`
   - Create service interface in `common/protocol/`
   - Implement service in `node/`
   - Use in chat widget

## Security Considerations

1. **API Keys**: Never hardcode API keys. Use:
   - Environment variables
   - IDE preferences (encrypted)
   - Secure keychain storage

2. **Rate Limiting**: Implement rate limiting for LLM API calls

3. **User Consent**: Ask users before executing agentic actions (compile, upload, etc.)

4. **Error Handling**: Always handle API failures gracefully

## Next Steps

1. ✅ Chat UI widget created
2. ⏳ Implement LLM API integration
3. ⏳ (Optional) Add agentic flow support in arduino-cli
4. ⏳ Add preferences for API keys
5. ⏳ Add error handling and loading states
6. ⏳ Add code syntax highlighting in chat messages
7. ⏳ Add ability to insert generated code into editor

## References

- [Arduino CLI Contributing Guide](https://arduino.github.io/arduino-cli/latest/CONTRIBUTING/)
- [gRPC Documentation](https://grpc.io/docs/)
- [Theia Widget Documentation](https://theia-ide.org/docs/widgets/)

