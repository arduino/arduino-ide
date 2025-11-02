# Arduino CLI Fork Setup Guide

This guide explains how to fork and integrate a custom Arduino CLI for the CognifyEV AI-Powered IDE.

## Overview

The Arduino IDE communicates with the Arduino CLI via gRPC. For AI-powered features, you'll need to:

1. Fork the Arduino CLI repository
2. Add AI-specific commands and services
3. Build from source
4. Integrate with the IDE

## Step 1: Fork Arduino CLI

1. Go to https://github.com/arduino/arduino-cli
2. Click "Fork" and create your fork (e.g., `CognifyEVOrg/arduino-cli`)

## Step 2: Clone Your Fork

```bash
cd ~/Documents/CognifyEV
git clone https://github.com/CognifyEVOrg/arduino-cli.git
cd arduino-cli
```

## Step 3: Setup Git Remotes

```bash
# Set your fork as origin
git remote set-url origin https://github.com/CognifyEVOrg/arduino-cli.git

# Add upstream for syncing with original
git remote add upstream https://github.com/arduino/arduino-cli.git

# Verify
git remote -v
```

## Step 4: Build Requirements

Ensure you have:
- Go 1.21 or later
- Make and C compiler (for native dependencies)
- Python 3.12+ with setuptools (for protocol generation)

```bash
# Check Go version
go version

# Install if needed (Arch Linux)
sudo pacman -S go

# Or use conda
conda activate arduino-ide-build
conda install -c conda-forge go
```

## Step 5: Build CLI from Source

```bash
cd ~/Documents/CognifyEV/arduino-cli

# Build the CLI
go build -o arduino-cli ./cmd/arduino-cli

# Test it
./arduino-cli version
```

## Step 6: Integrate with IDE

### Option A: Manual Replacement (Development)

```bash
# Back up original
cp ~/Documents/CognifyEV/embeddedIde/arduino-ide/arduino-ide-extension/src/node/resources/arduino-cli \
   ~/Documents/CognifyEV/embeddedIde/arduino-ide/arduino-ide-extension/src/node/resources/arduino-cli.backup

# Copy your build
cp ~/Documents/CognifyEV/arduino-cli/arduino-cli \
   ~/Documents/CognifyEV/embeddedIde/arduino-ide/arduino-ide-extension/src/node/resources/arduino-cli

# Restart IDE
```

### Option B: Update Download Script (Permanent)

Edit `arduino-ide-extension/scripts/download-cli.js` to download from your fork:

```javascript
// Replace the version check section to build from your fork
const version = {
  owner: 'CognifyEVOrg',
  repo: 'arduino-cli',
  commitish: 'main' // or specific commit/tag
};
```

Then modify the download script to use `taskBuildFromGit` instead of downloading pre-built binaries.

### Option C: Environment Variable Override (Advanced)

Modify `arduino-ide-extension/src/node/resources.ts`:

```typescript
// Add at the top
const customCliPath = process.env.ARDUINO_CLI_PATH;

// Update arduinoCliPath
export const arduinoCliPath = customCliPath 
  ? customCliPath 
  : path.join(resourcesPath, 'arduino-cli' + exe);
```

Then:
```bash
export ARDUINO_CLI_PATH=/path/to/your/arduino-cli
yarn start
```

## Step 7: Add AI Commands to CLI

### Create AI Service in CLI

1. **Create proto file**: `arduino-cli/rpc/cc/arduino/cli/commands/v1/ai_service.proto`
   ```protobuf
   syntax = "proto3";
   
   package cc.arduino.cli.commands.v1;
   
   service AIService {
     rpc GenerateCode(GenerateCodeRequest) returns (GenerateCodeResponse);
     rpc AnalyzeCode(AnalyzeCodeRequest) returns (AnalyzeCodeResponse);
     rpc SuggestOptimization(SuggestOptimizationRequest) returns (SuggestOptimizationResponse);
   }
   ```

2. **Implement handlers**: Create `arduino-cli/commands/ai.go`
   ```go
   package commands
   
   import (
       // ... imports
   )
   
   func (s *ArduinoCoreService) GenerateCode(ctx context.Context, req *GenerateCodeRequest) (*GenerateCodeResponse, error) {
       // AI code generation logic
   }
   ```

3. **Register service**: Add to CLI's gRPC server initialization

## Step 8: Update IDE Protocol Bindings

After modifying CLI proto files:

```bash
cd ~/Documents/CognifyEV/embeddedIde/arduino-ide

# Regenerate TypeScript bindings
conda activate arduino-ide-build
fnm use 20
yarn --cwd ./arduino-ide-extension generate-protocol
```

## Step 9: Create IDE Service Wrappers

Create TypeScript service in IDE to communicate with new CLI endpoints:

1. **Backend**: `arduino-ide-extension/src/node/ai-service-impl.ts`
2. **Frontend**: `arduino-ide-extension/src/browser/ai/ai-service-client-impl.ts`
3. **Protocol**: `arduino-ide-extension/src/common/protocol/ai-service.ts`

## Step 10: Development Workflow

### Sync with Upstream CLI

```bash
cd ~/Documents/CognifyEV/arduino-cli

# Fetch upstream changes
git fetch upstream

# Merge into your fork
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

### Rebuild and Test

```bash
# Build CLI
go build -o arduino-cli ./cmd/arduino-cli

# Copy to IDE
cp arduino-cli ~/Documents/CognifyEV/embeddedIde/arduino-ide/arduino-ide-extension/src/node/resources/arduino-cli

# Restart IDE
# (Kill existing process and start again)
cd ~/Documents/CognifyEV/embeddedIde/arduino-ide
conda activate arduino-ide-build
fnm use 20
yarn start
```

## Testing Your Changes

1. **Test CLI independently**:
   ```bash
   cd ~/Documents/CognifyEV/arduino-cli
   ./arduino-cli daemon --port 50051
   # In another terminal
   grpcurl -plaintext localhost:50051 list
   ```

2. **Test through IDE**:
   - Start IDE in development mode
   - Check IDE logs for gRPC communication
   - Verify new AI commands are accessible

## CI/CD Integration

For automated builds, update GitHub Actions to:

1. Build CLI from your fork
2. Run tests for both CLI and IDE
3. Create releases with custom CLI bundled

## Resources

- **Original CLI**: https://github.com/arduino/arduino-cli
- **CLI Contributing Guide**: https://arduino.github.io/arduino-cli/latest/CONTRIBUTING/
- **gRPC Guide**: https://grpc.io/docs/
- **Protocol Buffers**: https://protobuf.dev/

## Notes

- Always keep your CLI fork in sync with upstream for bug fixes
- Test gRPC compatibility when updating CLI versions
- Maintain backward compatibility where possible
- Document new AI endpoints for team members

