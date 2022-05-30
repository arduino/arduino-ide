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

In normal browsers, web pages usually run in a sandboxed environment, and accessing native resources are disallowed. However, Electron has the power to use Node.js APIs in the web pages allowing lower-level OS interactions. Due to security reasons, accessing native resources is an undesired behavior in the IDE. So by convention, we do not use Node.js APIs. (Note: the Node.js integration is [not yet disabled](https://github.com/eclipse-theia/theia/issues/2018) although it is not used). In the IDE, only the _backend_ allows OS interaction.

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

## Build from source

---

**ⓘ** If you only want to test an existing version of the project, automatically generated builds are available for download without building from source. See the instructions in the [**beta testing guide**](contributor-guide/beta-testing.md#beta-testing-guide).

---

If you’re familiar with TypeScript, the [Theia IDE](https://theia-ide.org/), and if you want to contribute to the
project, you should be able to build the Arduino IDE locally.
Please refer to the [Theia IDE prerequisites](https://github.com/eclipse-theia/theia/blob/master/doc/Developing.md#prerequisites) documentation for the setup instructions.
> **Note**: Node.js 16 must be used instead of the version 14 recommended at the link above.

Once you have all the tools installed, you can build the editor following these steps

1. Install the dependencies and build
    ```sh
    yarn
    ```

2. Rebuild the dependencies
    ```sh
    yarn rebuild:browser
    ```

3. Rebuild the electron dependencies
    ```sh
    yarn rebuild:electron
    ```

4. Start the application
    ```sh
    yarn start
    ```

### Notes for Windows contributors
Windows requires the Microsoft Visual C++ (MSVC) compiler toolset to be installed on your development machine.

In case it's not already present, it can be downloaded from the "**Tools for Visual Studio 20XX**" section of the Visual Studio [downloads page](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) via the "**Build Tools for Visual Studio 20XX**" (e.g., "**Build Tools for Visual Studio 2022**") download link.

Select "**Desktop development with C++**" from the "**Workloads**" tab during the installation procedure.

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

* *Can I manually change the version of the [`arduino-cli`](https://github.com/arduino/arduino-cli/) used by the IDE?*

    Yes. It is possible but not recommended. The CLI exposes a set of functionality via [gRPC](https://github.com/arduino/arduino-cli/tree/master/rpc) and the IDE uses this API to communicate with the CLI. Before we build a new version of IDE, we pin a specific version of CLI and use the corresponding `proto` files to generate TypeScript modules for gRPC. This means, a particular version of IDE is compliant only with the pinned version of CLI. Mismatching IDE and CLI versions might not be able to communicate with each other. This could cause unpredictable IDE behavior.

* *I have understood that not all versions of the CLI are compatible with my version of IDE but how can I manually update the `arduino-cli` inside the IDE?*

    [Get](https://arduino.github.io/arduino-cli/installation) the desired version of `arduino-cli` for your platform and manually replace the one inside the IDE. The CLI can be found inside the IDE at:
    - Windows: `C:\path\to\Arduino IDE\resources\app\node_modules\arduino-ide-extension\build\arduino-cli.exe`,
    - macOS: `/path/to/Arduino IDE.app/Contents/Resources/app/node_modules/arduino-ide-extension/build/arduino-cli`, and
    - Linux: `/path/to/Arduino IDE/resources/app/node_modules/arduino-ide-extension/build/arduino-cli`.

