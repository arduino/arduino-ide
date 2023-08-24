# Development Guide

This page includes technical documentation for developers who want to build the IDE locally and contribute to the project.

## Architecture overview

The IDE consists of three major parts:

- the _Electron main_ process,
- the _backend_, and
- the _frontend_.

The _Electron main_ process is responsible for:

- creating the application,
- managing the application lifecycle via listeners, and
- creating and managing the web pages for the app.

In Electron, the process that runs the main entry JavaScript file is called the main process. The _Electron main_ process can display a GUI by creating web pages. An Electron app always has exactly one main process.

By default, whenever the _Electron main_ process creates a web page, it will instantiate a new `BrowserWindow` instance. Since Electron uses Chromium for displaying web pages, Chromium's multi-process architecture is also used. Each web page in Electron runs in its own process, which is called the renderer process. Each `BrowserWindow` instance runs the web page in its own renderer process. When a `BrowserWindow` instance is destroyed, the corresponding renderer process is also terminated. The main process manages all web pages and their corresponding renderer processes. Each renderer process is isolated and only cares about the web page running in it.<sup>[[1]]</sup>

In normal browsers, web pages usually run in a sandboxed environment, and accessing native resources are disallowed. However, Electron has the power to use Node.js APIs in the web pages allowing lower-level OS interactions. Due to security reasons, accessing native resources is an undesired behavior in the IDE. So [`nodeIntegration`](https://www.electronjs.org/docs/latest/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content) is disabled, and [context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) is enabled.

The _backend_ process is responsible for:

- providing access to the filesystem,
- communicating with the [Arduino CLI](https://github.com/arduino/arduino-cli) via gRPC,
- running your terminal,
- exposing additional RESTful APIs,
- performing the Git commands in the local repositories,
- hosting and running any VS Code extensions, or
- executing VS Code tasks<sup>[[2]]</sup>.

The _Electron main_ process spawns the _backend_ process. There is always exactly one _backend_ process. However, due to performance considerations, the _backend_ spawns several sub-processes for the filesystem watching, Git repository discovery, etc. The communication between the _backend_ process and its sub-processes is established via IPC. Besides spawning sub-processes, the _backend_ will start an HTTP server on a random available port, and serves the web application as static content. When the sub-processes are up and running, and the HTTP server is also listening, the _backend_ process sends the HTTP server port to the _Electron main_ process via IPC. The _Electron main_ process will load the _backend_'s endpoint in the `BrowserWindow`.

The _frontend_ is running as an Electron renderer process and can invoke services implemented on the _backend_. The communication between the _backend_ and the _frontend_ is done via JSON-RPC over a websocket connection. This means, the services running in the _frontend_ are all proxies, and will ask the corresponding service implementation on the _backend_.

[1]: https://www.electronjs.org/docs/tutorial/application-architecture#differences-between-main-process-and-renderer-process
[2]: https://code.visualstudio.com/Docs/editor/tasks

### Additional Components

This repository contains the main code, but two more repositories are included during the build process:

- [vscode-arduino-tools](https://github.com/arduino/vscode-arduino-tools): provides support for the language server and the debugger
- [arduino-language-server](https://github.com/arduino/arduino-language-server): provides the language server that parses Arduino code

## Prerequisites

- To build the application, follow the Theia IDE [prerequisites](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#prerequisites).
- This project recommends using [Visual Studio Code (VS Code)](https://code.visualstudio.com/) for the development.

## Build from source

---

**ⓘ** If you only want to test an existing version of the project, automatically generated builds are available for download without building from source. See the instructions in the [**beta testing guide**](contributor-guide/beta-testing.md#beta-testing-guide).

---

If you’re familiar with TypeScript, the [Theia IDE](https://theia-ide.org/), and if you want to contribute to the
project, you should be able to build the Arduino IDE locally.
Please refer to the [Theia IDE prerequisites](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#prerequisites) documentation for the setup instructions.

Once you have all the tools installed, you can build the editor following these steps

### Run From Source

If you want to develop the application, do the following:

1. Clone the project from Git and change directory to the `arduino-ide` folder:

   ```sh
   git clone https://github.com/arduino/arduino-ide.git
   ```

   ```sh
   cd arduino-ide
   ```

2. Install the dependencies

   ```sh
   yarn
   ```

3. Build the application in development mode

   ```sh
   yarn build:dev
   ```

4. Open the project in VS Code

   ```sh
   code .
   ```

   > **ⓘ** For more details on how to start VS Code from the command line, see [here](https://code.visualstudio.com/docs/editor/command-line#_launching-from-command-line).

5. Rebuild the native dependencies for electron

   - <kbd>Ctrl/⌘</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> to open the _Command Palette_.
   - Type `Tasks: Run Task` and press <kbd>Enter</kbd>.
   - Type `Rebuild App` and press <kbd>Enter</kbd>.
   - Wait for the "Rebuild App" task to finish, as indicated by a "✔ Rebuild Complete" message in the Terminal.

6. Start the TypeScript compiler + `webpack` in watch mode

   - <kbd>Ctrl/⌘</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>.
   - Type `Tasks: Run Task` and press <kbd>Enter</kbd>.
   - Type `Watch All` and press <kbd>Enter</kbd>.
   - Select how you want to scan the task output. You can press <kbd>Enter</kbd> or <kbd>Esc</kbd>. [Click](https://code.visualstudio.com/docs/editor/tasks#_defining-a-problem-matcher) here to learn more.

7. Start the application in debug mode
   - Open the _Run and Debug_ view with <kbd>Ctrl/⌘</kbd>+<kbd>Shift</kbd>+<kbd>D</kbd>,
   - Select `App` from the dropdown,
   - Start debugging with <kbd>F5</kbd>.

If you change the backend application, you must restart the electron app in debug mode to use the changes.
If you change the frontend application, it's sufficient to reload the board window with _Reload Window_ command from the _Command Palette_.

### Bundle the Application

If you want to bundle the application, execute the following:

1. Rebuild the native dependencies for electron

   ```sh
   yarn --cwd electron-app rebuild
   ```

2. Bundle the frontend and backend applications with `webpack`

   ```sh
   yarn --cwd electron-app build
   ```

3. Package the application
   ```sh
   yarn --cwd electron-app package
   ```

### Notes for Windows contributors

Windows requires the Microsoft Visual C++ (MSVC) compiler toolset to be installed on your development machine.

In case it's not already present, it can be downloaded from the "**Tools for Visual Studio 20XX**" section of the Visual Studio [downloads page](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) via the "**Build Tools for Visual Studio 20XX**" (e.g., "**Build Tools for Visual Studio 2022**") download link.

Select "**Desktop development with C++**" from the "**Workloads**" tab during the installation procedure.

## Running Checks

To run the tests, you must rebuild the native dependencies for the browser target. See [this](https://github.com/arduino/arduino-ide/pull/1823#issuecomment-1400511031) for the technical explanation.

1. Rebuild the native dependencies for the browser

   ```sh
   yarn rebuild:browser
   ```

2. To run the tests

   ```sh
   yarn test
   ```

3. To run the slow tests
   ```sh
   yarn test:slow
   ```

If you want to debug an individual file, open the test module (`*.test.ts` or `*.slow-test.ts`), open the _Run and Debug_ view, select the `Run Test [current]` and press <kbd>F5</kbd>.

### CI

This project is built on [GitHub Actions](https://github.com/arduino/arduino-ide/actions).

- _Snapshot_ builds run when changes are pushed to the `main` branch, or when a PR is created against the `main` branch. For the sake of the review and verification process, the build artifacts for each operating system can be downloaded from the GitHub Actions page.
- _Nightly_ builds run every day at 03:00 GMT from the `main` branch.
- _Release_ builds run when a new tag is pushed to the remote. The tag must follow the [semver](https://semver.org/). For instance, `1.2.3` is a correct tag, but `v2.3.4` won't work. Steps to trigger a new release build:
  - Create a local tag:
  ```sh
  git tag -a 1.2.3 -m "Creating a new tag for the `1.2.3` release."
  ```
  - Push it to the remote:
  ```sh
   git push origin 1.2.3
  ```

## FAQ

- _Can I manually change the version of the [`arduino-cli`](https://github.com/arduino/arduino-cli/) used by the IDE?_

  Yes. It is possible but not recommended. The CLI exposes a set of functionality via [gRPC](https://github.com/arduino/arduino-cli/tree/master/rpc) and the IDE uses this API to communicate with the CLI. Before we build a new version of IDE, we pin a specific version of CLI and use the corresponding `proto` files to generate TypeScript modules for gRPC. This means, a particular version of IDE is compliant only with the pinned version of CLI. Mismatching IDE and CLI versions might not be able to communicate with each other. This could cause unpredictable IDE behavior.

- _I have understood that not all versions of the CLI are compatible with my version of IDE but how can I manually update the `arduino-cli` inside the IDE?_

  [Get](https://arduino.github.io/arduino-cli/installation) the desired version of `arduino-cli` for your platform and manually replace the one inside the IDE. The CLI can be found inside the IDE at:

  - Windows: `C:\path\to\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe`,
  - macOS: `/path/to/Arduino IDE.app/Contents/Resources/app/lib/backend/resources/arduino-cli`, and
  - Linux: `/path/to/Arduino IDE/resources/app/lib/backend/resources/arduino-cli`.
