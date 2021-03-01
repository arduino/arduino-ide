# Development

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

In Electron, the process that runs the main entry JavaScript file is called the main process. The _Electron main_ process can display a GUI by creating web pages. An Electron app always has exactly on main process.

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


## Build from source

If you’re familiar with TypeScript, the [Theia IDE](https://theia-ide.org/), and if you want to contribute to the
project, you should be able to build the Arduino IDE locally. Please refer to the [Theia IDE prerequisites](https://github.com/theia-ide/theia/blob/master/doc/) documentation for the setup instructions.

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

This project is built on [GitHub Actions](https://github.com/arduino/arduino-ide/actions).

 - _Snapshot_ builds run when changes are pushed to the `main` branch, or when a PR is created against the `main` branch. For the sake of the review and verification process, the build artifacts can be downloaded from the GitHub Actions page. Note: [due to a limitation](https://github.com/actions/upload-artifact/issues/80#issuecomment-630030144) with the GH Actions UI, you cannot download a particular build, but you have to get all together inside the `build-artifacts.zip`.
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

### Creating a release

You will not need to create a new release yourself as the Arduino team takes care of this on a regular basis, but we are documenting the process here. Let's assume the current version is `0.1.3` and you want to release `0.2.0`.

 - Make sure the `main` state represents what you want to release and you're on `main`.
 - Prepare a release-candidate build on a branch:
```bash
git branch 0.2.0-rc \
&& git checkout 0.2.0-rc
```
 - Bump up the version number. It must be a valid [semver](https://semver.org/) and must be greater than the current one:
```bash
yarn update:version 0.2.0
```
 - This should generate multiple outgoing changes with the version update.
 - Commit your changes and push to the remote:
```bash
git add . \
&& git commit -s -m "Updated versions to 0.2.0" \
&& git push
```
 - Create the GH PR the workflow starts automatically.
 - Once you're happy with the RC, merge the changes to the `main`.
 - Create a tag and push it:
```bash
git tag -a 0.2.0 -m "0.2.0" \
&& git push origin 0.2.0
```
 - The release build starts automatically and uploads the artifacts with the changelog to the  [release page](https://github.com/arduino/arduino-ide/releases).
 - If you do not want to release the `EXE` and `MSI` installers, wipe them manually.
 - If you do not like the generated changelog, modify it and update the GH release.

## FAQ

* *Can I manually change the version of the [`arduino-cli`](https://github.com/arduino/arduino-cli/) used by the IDE?*

    Yes. It is possible but not recommended. The CLI exposes a set of functionality via [gRPC](https://github.com/arduino/arduino-cli/tree/master/rpc) and the IDE uses this API to communicate with the CLI. Before we build a new version of IDE, we pin a specific version of CLI and use the corresponding `proto` files to generate TypeScript modules for gRPC. This means, a particular version of IDE is compliant only with the pinned version of CLI. Mismatching IDE and CLI versions might not be able to communicate with each other. This could cause unpredictable IDE behavior.

* *I have understood that not all versions of the CLI are compatible with my version of IDE but how can I manually update the `arduino-cli` inside the IDE?*

    [Get](https://arduino.github.io/arduino-cli/installation) the desired version of `arduino-cli` for your platform and manually replace the one inside the IDE. The CLI can be found inside the IDE at:
    - Windows: `C:\path\to\Arduino IDE\resources\app\node_modules\arduino-ide-extension\build\arduino-cli.exe`,
    - macOS: `/path/to/Arduino IDE.app/Contents/Resources/app/node_modules/arduino-ide-extension/build/arduino-cli`, and
    - Linux: `/path/to/Arduino IDE/resources/app/node_modules/arduino-ide-extension/build/arduino-cli`.

