# Arduino Pro IDE

[![Arduino Pro IDE](https://github.com/bcmi-labs/arduino-editor/workflows/Arduino%20Pro%20IDE/badge.svg)](https://github.com/bcmi-labs/arduino-editor/actions?query=workflow%3A%22Arduino+Pro+IDE%22)

### Download

You can download the latest version of the Arduino Pro IDE application for the supported platforms from the [GitHub release page](https://github.com/arduino/arduino-pro-ide/releases) or following the links in the following table.

#### Latest version

Platform  | 32 bit                   | 64 bit                   |
--------- | ------------------------ | ------------------------ |
Linux     |                          | [Linux 64 bit]           |
Linux ARM | [🚧 Work in progress...] | [🚧 Work in progress...] |
Windows   |                          | [Windows 64 bit]         |
macOS     |                          | [macOS 64 bit]           |

[🚧 Work in progress...]: https://github.com/arduino/arduino-pro-ide/issues/287
[Linux 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/arduino-pro-ide_latest_Linux_64bit.zip
[Windows 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/arduino-pro-ide_latest_Windows_64bit.zip
[macOS 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/arduino-pro-ide_latest_macOS_64bit.dmg

#### Previous versions

These are available from the [GitHub releases page](https://github.com/arduino/arduino-pro-ide/releases).

#### Nightly builds

These builds are generated every day at 03:00 GMT from the `master` branch and
should be considered unstable. In order to get the latest nightly build
available for the supported platform, use the following links:

Platform  | 32 bit                   | 64 bit                   |
--------- | ------------------------ | ------------------------ |
Linux     |                          | [Nightly Linux 64 bit]   |
Linux ARM | [🚧 Work in progress...] | [🚧 Work in progress...] |
Windows   |                          | [Nightly Windows 64 bit] |
macOS     |                          | [Nightly macOS 64 bit]   |

[🚧 Work in progress...]: https://github.com/arduino/arduino-pro-ide/issues/287
[Nightly Linux 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/nightly/arduino-pro-ide_nightly-latest_Linux_64bit.zip
[Nightly Windows 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/nightly/arduino-pro-ide_nightly-latest_Windows_64bit.zip
[Nightly macOS 64 bit]: https://downloads.arduino.cc/arduino-pro-ide/nightly/arduino-pro-ide_nightly-latest_macOS_64bit.dmg

> These links return an HTTP `302: Found` response, redirecting to latest
  generated builds by replacing `latest` with the latest available build
  date, using the format YYYYMMDD (i.e for 2019/Aug/06 `latest` is
  replaced with `20190806` )

### Build from source

If you’re familiar with TypeScript, the [Theia IDE](https://theia-ide.org/), and if you want to contribute to the
project, you should be able to build the Arduino Pro IDE locally. Please refer to the [Theia IDE prerequisites](https://github.com/theia-ide/theia/blob/master/doc/) documentation for the setup instructions.

### Build
```sh
yarn
```

### Rebuild the native dependencies
```sh
yarn rebuild:electron
```

### Start
```sh
yarn start
```

### CI

This project is built on [GitHub Actions](https://github.com/bcmi-labs/arduino-editor/actions?query=workflow%3A%22Arduino+Pro+IDE%22).

 - _Snapshot_ builds run when changes are pushed to the `master` branch, or when a PR is created against the `master` branch. For the sake of the review and verification process, the build artifacts can be downloaded from the GitHub Actions page. Note: [due to a limitation](https://github.com/actions/upload-artifact/issues/80#issuecomment-630030144) with the GH Actions UI, you cannot download a particular build, but you have to get all together inside the `build-artifacts.zip`.
 - _Nightly_ builds run every day at 03:00 GMT from the `master` branch.
 - _Release_ builds run when a new tag is pushed to the remote. The tag must follow the [semver](https://semver.org/). For instance, `1.2.3` is a correct tag, but `v2.3.4` won't work. Steps to trigger a new release build:
   - Create a local tag:
    ```sh
    git tag -a 1.2.3 -m "Creating a new tag for the `1.2.3` release."
    ```
   - Push it to the remote:
   ```sh
    git push origin 1.2.3
   ```

### FAQ

 - Q: Can I manually change the version of the [`arduino-cli`](https://github.com/arduino/arduino-cli/) used by the IDE?
 - A: Yes. It is possible but not recommended. The CLI exposes a set of functionality via [gRPC](https://github.com/arduino/arduino-cli/tree/master/rpc) and the IDE uses this API to communicate with the CLI. Before we build a new version of IDE, we pin a specific version of CLI and use the corresponding `proto` files to generate TypeScript modules for gRPC. This means, a particular version of IDE is compliant only with the pinned version of CLI. Mismatching IDE and CLI versions might not be able to communicate with each other. This could cause unpredictable IDE behavior.

 - Q: I have understood that not all versions of the CLI is compatible with my version of IDE but how can I manually update the `arduino-cli` inside the IDE?
 - A: [Get](https://arduino.github.io/arduino-cli/installation) the desired version of `arduino-cli` for your platform and manually replace the one inside the IDE. The CLI can be found inside the IDE at:
   - Windows: `C:\path\to\Arduino Pro IDE\resources\app\node_modules\arduino-ide-extension\build\arduino-cli.exe`,
   - macOS: `/path/to/Arduino Pro IDE.app/Contents/Resources/app/node_modules/arduino-ide-extension/build/arduino-cli`, and
   - Linux: `/path/to/Arduino Pro IDE/resources/app/node_modules/arduino-ide-extension/build/arduino-cli`.

### Architecture overview

The Pro IDE consists of three major parts:
 - the _Electron main_ process,
 - the _backend_, and 
 - the _frontend_.

The _Electron main_ process is responsible for:
 - creating the application,
 - managing the application lifecycle via listeners, and
 - creating and managing the web pages for the app.

In Electron, the process that runs the main entry JavaScript file is called the main process. The _Electron main_ process can display a GUI by creating web pages. An Electron app always has exactly on main process.

By default, whenever the _Electron main_ process creates a web page, it will instantiate a new `BrowserWindow` instance. Since Electron uses Chromium for displaying web pages, Chromium's multi-process architecture is also used. Each web page in Electron runs in its own process, which is called the renderer process. Each `BrowserWindow` instance runs the web page in its own renderer process. When a `BrowserWindow` instance is destroyed, the corresponding renderer process is also terminated. The main process manages all web pages and their corresponding renderer processes. Each renderer process is isolated and only cares about the web page running in it.<sup>[[1]]</sup>

In normal browsers, web pages usually run in a sandboxed environment, and accessing native resources are disallowed. However, Electron has the power to use Node.js APIs in the web pages allowing lower-level OS interactions. Due to security reasons, accessing native resources is an undesired behavior in the Pro IDE. So by convention, we do not use Node.js APIs. (Note: the Node.js integration is [not yet disabled](https://github.com/eclipse-theia/theia/issues/2018) although it is not used). In the Pro IDE, only the _backend_ allows OS interaction.

The _backend_ process is responsible for:
 - providing access to the filesystem,
 - communicating with the Arduino CLI via gRPC,
 - running your terminal,
 - exposing additional RESTful APIs,
 - performing the Git commands in the local repositories,
 - hosting and running any VS Code extensions, or
 - executing VS Code tasks<sup>[[2]]</sup>.

The _Electron main_ process spawns the _backend_ process. There is always exactly one _backend_ process. However, due to performance considerations, the _backend_ spawns several sub-processes for the filesystem watching, Git repository discovery, etc. The communication between the _backend_ process and its sub-processes is established via IPC. Besides spawning sub-processes, the _backend_ will start an HTTP server on a random available port, and serves the web application as static content. When the sub-processes are up and running, and the HTTP server is also listening, the _backend_ process sends the HTTP server port to the _Electron main_ process via IPC. The _Electron main_ process will load the _backend_'s endpoint in the `BrowserWindow`.

The _frontend_ is running as an Electron renderer process and can invoke services implemented on the _backend_. The communication between the _backend_ and the _frontend_ is done via JSON-RPC over a websocket connection. This means, the services running in the _frontend_ are all proxies, and will ask the corresponding service implementation on the _backend_.

[1]: https://www.electronjs.org/docs/tutorial/application-architecture#differences-between-main-process-and-renderer-process
[2]: https://code.visualstudio.com/Docs/editor/tasks
