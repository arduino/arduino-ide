# Development Setup Guide for CognifyEV AI-Powered Arduino IDE

This guide explains how to work with the Arduino CLI for extending the IDE with AI capabilities.

**Repository**: [CognifyEVOrg/arduino-ide](https://github.com/CognifyEVOrg/arduino-ide)  
**Forked from**: [arduino/arduino-ide](https://github.com/arduino/arduino-ide)

## Current Setup

- **Arduino CLI Version**: 1.2.0 (pre-built binary)
- **Location**: `arduino-ide-extension/src/node/resources/arduino-cli`
- **Communication**: gRPC (ArduinoCoreService) on localhost
- **CLI Repository**: https://github.com/arduino/arduino-cli

## Why You Need to Build CLI from Source

For an AI-powered agentic IDE, you'll likely need to:

1. **Extend CLI Functionality**: Add new commands for AI features (e.g., `arduino-cli ai generate`, `arduino-cli ai analyze`)
2. **Custom gRPC Services**: Create new gRPC endpoints for agentic workflows
3. **Enhanced Build Pipeline**: Integrate AI suggestions during compilation
4. **Intelligent Board Detection**: AI-assisted board detection and configuration

## Building Arduino CLI from Source

### Prerequisites

According to the [Arduino CLI contributing guide](https://arduino.github.io/arduino-cli/latest/CONTRIBUTING/#prerequisites):

```bash
# Go (for building the CLI)
go version  # Need 1.21 or later

# Install Go if needed
# On Arch Linux:
sudo pacman -S go

# Or use your conda environment:
conda activate arduino-ide-build
conda install -c conda-forge go
```

### Build Steps

1. **Clone Arduino CLI repository**:
```bash
cd ~/Documents/CognifyEV
git clone https://github.com/arduino/arduino-cli.git
cd arduino-cli
```

2. **Build the CLI**:
```bash
go build -o arduino-cli ./cmd/arduino-cli
```

3. **Replace the IDE's CLI binary**:
```bash
# Back up original
cp ~/Documents/CognifyEV/embeddedIde/arduino-ide/arduino-ide-extension/src/node/resources/arduino-cli \
   ~/Documents/CognifyEV/embeddedIde/arduino-ide/arduino-ide-extension/src/node/resources/arduino-cli.backup

# Copy your custom build
cp ~/Documents/CognifyEV/arduino-cli/arduino-cli \
   ~/Documents/CognifyEV/embeddedIde/arduino-ide/arduino-ide-extension/src/node/resources/arduino-cli
```

4. **Rebuild IDE protocol bindings** (if you changed gRPC definitions):
```bash
cd ~/Documents/CognifyEV/embeddedIde/arduino-ide
conda activate arduino-ide-build
fnm use 20
yarn --cwd ./arduino-ide-extension generate-protocol
```

## Development Workflow

### Option 1: Development Mode (Recommended)

1. **Keep both repositories in sync**:
   ```bash
   # In arduino-cli repo
   go build -o arduino-cli ./cmd/arduino-cli
   cp arduino-cli ../embeddedIde/arduino-ide/arduino-ide-extension/src/node/resources/arduino-cli
   ```

2. **Restart IDE** (CLI runs as daemon, needs restart):
   ```bash
   # Kill any running IDE instances
   pkill -f "arduino-ide"
   
   # Start IDE again
   cd ~/Documents/CognifyEV/embeddedIde/arduino-ide
   conda activate arduino-ide-build
   fnm use 20
   yarn start
   ```

### Option 2: Use CLI from System PATH (Advanced)

Modify `arduino-ide-extension/src/node/resources.ts` to allow environment variable override:

```typescript
// Add environment variable check
const customCliPath = process.env.ARDUINO_CLI_PATH;
export const arduinoCliPath = customCliPath 
  ? customCliPath 
  : path.join(resourcesPath, 'arduino-cli' + exe);
```

Then set:
```bash
export ARDUINO_CLI_PATH=/path/to/your/custom/arduino-cli
yarn start
```

## Extending CLI for AI Features

### Adding New gRPC Commands

1. **Define proto files** in `arduino-cli/rpc/cc/arduino/cli/commands/v1/`
2. **Implement handlers** in `arduino-cli/commands/`
3. **Regenerate IDE protocol bindings**:
   ```bash
   cd arduino-ide-extension
   yarn generate-protocol
   ```

### Example: AI Command Structure

```go
// In arduino-cli/commands/ai.go
package commands

import (
    // ... imports
)

type AIService struct {
    // Your AI service implementation
}

func (s *AIService) GenerateCode(ctx context.Context, req *AIGenerateRequest) (*AIGenerateResponse, error) {
    // AI-powered code generation
}
```

## Key Files for IDE-CLI Integration

- **CLI Daemon**: `arduino-ide-extension/src/node/arduino-daemon-impl.ts`
- **Core Client**: `arduino-ide-extension/src/node/core-client-provider.ts`
- **Core Service**: `arduino-ide-extension/src/node/core-service-impl.ts`
- **gRPC Protocol**: `arduino-ide-extension/src/node/cli-protocol/`
- **CLI Path**: `arduino-ide-extension/src/node/resources.ts`

## Testing Your Changes

1. **Test CLI independently**:
   ```bash
   cd ~/Documents/CognifyEV/arduino-cli
   ./arduino-cli version
   ./arduino-cli daemon --port 50051
   ```

2. **Test through IDE**:
   - Start IDE in development mode
   - Check IDE logs for gRPC communication
   - Verify your new commands are accessible

## Next Steps for AI Integration

1. **Analyze existing CLI commands** to understand the pattern
2. **Design AI-specific commands** (generate, analyze, suggest, etc.)
3. **Extend IDE frontend** to expose AI features in the UI
4. **Create AI service layer** between IDE and CLI for agentic workflows

## Resources

- [Arduino CLI Repository](https://github.com/arduino/arduino-cli)
- [Arduino CLI Contributing Guide](https://arduino.github.io/arduino-cli/latest/CONTRIBUTING/)
- [gRPC Documentation](https://grpc.io/docs/)
- [Theia Extension Guide](https://theia-ide.org/docs/authoring_extensions/)

