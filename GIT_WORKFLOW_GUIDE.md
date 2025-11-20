# Git Workflow Guide for CognifyEV Arduino IDE Fork

## Current Situation

You have:
- **Uncommitted changes**: Chat integration features (new files + modifications)
- **Goal**: Build Windows distributable exe after adding new features
- **Concern**: Managing upstream changes and potential conflicts

## ⚠️ **DO NOT Push Directly to `main`**

**Recommendation**: Create a feature branch for your chat integration work.

## Recommended Workflow

### Step 1: Create and Switch to Feature Branch

```bash
# Create a new branch for chat integration
git checkout -b feature/chat-integration

# Verify you're on the new branch
git branch
```

### Step 2: Commit Your Current Changes

```bash
# Stage all changes (modified + new files)
git add .

# Commit with descriptive message
git commit -m "feat: Add chat LLM integration widget

- Add chat widget UI component
- Integrate chat tab in sidebar
- Add chat styles and icons
- Update frontend module and preferences
- Add documentation for LLM integration
- Update branding (CognifyEV icons, EULA)"

# Verify commit
git log --oneline -1
```

### Step 3: Push Feature Branch to Origin

```bash
# Push feature branch to origin (NOT main)
git push -u origin feature/chat-integration
```

### Step 4: Build Windows Distributable

You can build from the feature branch:

```bash
# Make sure you're on the feature branch
git checkout feature/chat-integration

# Install dependencies (if not already done)
yarn install

# Build the extension
yarn --cwd ./arduino-ide-extension build

# Rebuild electron native modules
yarn --cwd ./electron-app rebuild

# Build electron app
yarn --cwd ./electron-app build

# Package for Windows (creates .exe, .msi, .zip in electron-app/dist/)
yarn --cwd ./electron-app package
```

The Windows executables will be in:
- `electron-app/dist/arduino-ide-*.exe` (NSIS installer)
- `electron-app/dist/arduino-ide-*.msi` (MSI installer)
- `electron-app/dist/arduino-ide-*.zip` (Portable zip)

### Step 5: Merge to Main (After Testing)

Once you've tested the build and everything works:

```bash
# Switch to main
git checkout main

# Pull latest from origin/main (if others have pushed)
git pull origin main

# Merge feature branch
git merge feature/chat-integration

# Push to origin/main
git push origin main
```

## Managing Upstream Changes

### Strategy: Keep Your Fork Updated

Since you're maintaining a fork, you'll want to periodically merge changes from upstream:

```bash
# Fetch latest from upstream (original Arduino IDE)
git fetch upstream

# Check what's new
git log main..upstream/main --oneline

# Option 1: Merge upstream into your main (recommended)
git checkout main
git merge upstream/main

# Option 2: Rebase your changes on top of upstream (cleaner history, but more complex)
git checkout main
git rebase upstream/main
```

### Handling Conflicts

If there are conflicts when merging upstream:

1. **Identify conflicted files**:
   ```bash
   git status
   ```

2. **Resolve conflicts manually**:
   - Open conflicted files
   - Look for `<<<<<<<`, `=======`, `>>>>>>>` markers
   - Keep your changes, upstream changes, or merge both

3. **After resolving**:
   ```bash
   git add <resolved-files>
   git commit -m "Merge upstream/main: resolve conflicts"
   ```

### Recommended Branch Structure

```
main (stable, production-ready)
  ├── feature/chat-integration (your current work)
  ├── feature/other-feature (future features)
  └── release/v2.3.7-cognifyev (for tagged releases)
```

## Building for Distribution

### For Windows Users

1. **Build on Windows** (recommended for signing):
   ```bash
   yarn --cwd ./electron-app package
   ```

2. **Or build on Linux** (cross-platform, but may need Windows for signing):
   ```bash
   # Set target platform
   export npm_config_target_platform=win32
   yarn --cwd ./electron-app package
   ```

3. **Code Signing** (optional but recommended):
   - Windows executables should be signed for distribution
   - See `electron-app/scripts/windowsCustomSign.js`
   - Requires a code signing certificate

### Creating a Release

For a proper release:

```bash
# 1. Ensure main is up to date
git checkout main
git pull origin main

# 2. Create a release branch
git checkout -b release/v2.3.7-cognifyev

# 3. Update version numbers if needed
# Edit package.json files

# 4. Build and test
yarn install
yarn --cwd ./arduino-ide-extension build
yarn --cwd ./electron-app rebuild
yarn --cwd ./electron-app build
yarn --cwd ./electron-app package

# 5. Tag the release
git tag -a v2.3.7-cognifyev -m "Release v2.3.7 with chat integration"
git push origin v2.3.7-cognifyev

# 6. Merge to main
git checkout main
git merge release/v2.3.7-cognifyev
git push origin main
```

## Best Practices

1. **Always work on feature branches** - Never commit directly to `main`
2. **Keep `main` stable** - Only merge tested, working code
3. **Regular upstream syncs** - Merge upstream changes monthly or as needed
4. **Test before merging** - Always test builds before merging to main
5. **Use descriptive commit messages** - Follow conventional commits format
6. **Tag releases** - Tag stable versions for easy reference

## Quick Reference Commands

```bash
# Create feature branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "feat: description"

# Push feature branch
git push -u origin feature/your-feature

# Update from upstream
git fetch upstream
git checkout main
git merge upstream/main

# Build Windows package
yarn --cwd ./electron-app package

# Create release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Next Steps for Your Current Work

1. ✅ Create `feature/chat-integration` branch
2. ✅ Commit your current changes
3. ✅ Push to origin (feature branch)
4. ✅ Build Windows distributable
5. ✅ Test the build
6. ✅ Merge to main after testing
7. ✅ Create a release tag if ready

