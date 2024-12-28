// @ts-check

(async () => {
  const os = require('node:os');
  const path = require('node:path');
  const decompress = require('decompress');
  const unzip = require('decompress-unzip');
  const { mkdirSync, promises: fs, rmSync, existsSync } = require('node:fs');
  const { exec } = require('./utils');
  const { glob } = require('glob');
  const { SemVer, gte, valid: validSemVer, eq } = require('semver');
  // Use a node-protoc fork until apple arm32 is supported
  // https://github.com/YePpHa/node-protoc/pull/10
  const protoc = path.dirname(require('@pingghost/protoc/protoc'));

  const { owner, repo, commitish } = (() => {
    const pkg = require(path.join(__dirname, '..', 'package.json'));
    if (!pkg) {
      console.log(`Could not parse the 'package.json'.`);
      process.exit(1);
    }

    const defaultVersion = {
      owner: 'arduino',
      repo: 'arduino-cli',
      commitish: undefined,
    };
    const { arduino } = pkg;
    if (!arduino) {
      return defaultVersion;
    }

    const cli = arduino['arduino-cli'];
    if (!cli) {
      return defaultVersion;
    }

    const { version } = cli;
    if (!version) {
      return defaultVersion;
    }

    if (typeof version === 'string') {
      return defaultVersion;
    }

    // We assume an object with `owner`, `repo`, commitish?` properties.
    const { owner, repo, commitish } = version;
    if (!owner) {
      console.log(`Could not retrieve 'owner' from ${JSON.stringify(version)}`);
      process.exit(1);
    }
    if (!repo) {
      console.log(`Could not retrieve 'repo' from ${JSON.stringify(version)}`);
      process.exit(1);
    }

    return { owner, repo, commitish };
  })();

  const { platform } = process;
  const resourcesFolder = path.join(
    __dirname,
    '..',
    'src',
    'node',
    'resources'
  );
  const cli = path.join(
    resourcesFolder,
    `arduino-cli${platform === 'win32' ? '.exe' : ''}`
  );
  const versionJson = exec(cli, ['version', '--format', 'json'], {
    logStdout: true,
  }).trim();
  if (!versionJson) {
    console.log(`Could not retrieve the CLI version from ${cli}.`);
    process.exit(1);
  }
  // As of today (28.01.2021), the `VersionString` can be one of the followings:
  //  - `nightly-YYYYMMDD` stands for the nightly build, we use the , the `commitish` from the `package.json` to check out the code.
  //  - `0.0.0-git` for local builds, we use the `commitish` from the `package.json` to check out the code and generate the APIs.
  //  - `git-snapshot` for local build executed via `task build`. We do not do this.
  //  - rest, we assume it is a valid semver and has the corresponding tagged code, we use the tag to generate the APIs from the `proto` files.
  /*
    {
      "Application": "arduino-cli",
      "VersionString": "nightly-20210126",
      "Commit": "079bb6c6",
      "Status": "alpha",
      "Date": "2021-01-26T01:46:31Z"
    }
  */
  const versionObject = JSON.parse(versionJson);

  async function globProtos(folder, pattern = '**/*.proto') {
    let protos = [];
    try {
      const matches = await glob(pattern, { cwd: folder });
      protos = matches.map((filename) => path.join(folder, filename));
    } catch (error) {
      console.log(error.stack ?? error.message);
    }
    return protos;
  }

  async function getProtosFromRepo(
    commitish = '',
    version = '',
    owner = 'arduino',
    repo = 'arduino-cli'
  ) {
    const repoFolder = await fs.mkdtemp(path.join(os.tmpdir(), 'arduino-cli-'));

    const url = `https://github.com/${owner}/${repo}.git`;
    console.log(`>>> Cloning repository from '${url}'...`);
    exec('git', ['clone', url, repoFolder], { logStdout: true });
    console.log(`<<< Repository cloned.`);

    if (validSemVer(version)) {
      let versionTag = version;
      // https://github.com/arduino/arduino-cli/pull/2374
      if (
        gte(new SemVer(version, { loose: true }), new SemVer('0.35.0-rc.1'))
      ) {
        versionTag = `v${version}`;
      }
      console.log(`>>> Checking out tagged version: '${versionTag}'...`);
      exec('git', ['-C', repoFolder, 'fetch', '--all', '--tags'], {
        logStdout: true,
      });
      exec(
        'git',
        ['-C', repoFolder, 'checkout', `tags/${versionTag}`, '-b', versionTag],
        { logStdout: true }
      );
      console.log(`<<< Checked out tagged version: '${versionTag}'.`);
    } else if (commitish) {
      console.log(`>>> Checking out commitish: '${commitish}'...`);
      exec('git', ['-C', repoFolder, 'checkout', commitish], {
        logStdout: true,
      });
      console.log(`<<< Checked out commitish: '${commitish}'.`);
    } else {
      console.log(
        `WARN: no 'git checkout'. Generating from the HEAD revision.`
      );
    }

    const rpcFolder = await fs.mkdtemp(
      path.join(os.tmpdir(), 'arduino-cli-rpc')
    );

    // Copy the the repository rpc folder so we can remove the repository
    await fs.cp(path.join(repoFolder, 'rpc'), path.join(rpcFolder), {
      recursive: true,
    });
    rmSync(repoFolder, { recursive: true, maxRetries: 5, force: true });

    // Patch for https://github.com/arduino/arduino-cli/issues/2755
    // Google proto files are removed from source since v1.1.0
    if (!existsSync(path.join(rpcFolder, 'google'))) {
      // Include packaged google proto files from v1.1.1
      // See https://github.com/arduino/arduino-cli/pull/2761
      console.log(`>>> Missing google proto files. Including from v1.1.1...`);
      const v111ProtoFolder = await getProtosFromZip('1.1.1');

      // Create an return a folder name google in rpcFolder
      const googleFolder = path.join(rpcFolder, 'google');
      await fs.cp(path.join(v111ProtoFolder, 'google'), googleFolder, {
        recursive: true,
      });
      console.log(`<<< Included google proto files from v1.1.1.`);
    }

    return rpcFolder;
  }

  async function getProtosFromZip(version) {
    if (!version) {
      console.log(`Could not download proto files: CLI version not provided.`);
      process.exit(1);
    }
    console.log(`>>> Downloading proto files from zip for ${version}.`);

    const url = `https://downloads.arduino.cc/arduino-cli/arduino-cli_${version}_proto.zip`;
    const protos = await fs.mkdtemp(
      path.join(os.tmpdir(), 'arduino-cli-proto')
    );

    const { default: download } = await import('@xhmikosr/downloader');
    /** @type {import('node:buffer').Buffer} */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const data = await download(url);

    await decompress(data, protos, {
      plugins: [unzip()],
      filter: (file) => file.path.endsWith('.proto'),
    });

    console.log(
      `<<< Finished downloading and extracting proto files for ${version}.`
    );

    return protos;
  }

  let protosFolder;

  if (commitish) {
    protosFolder = await getProtosFromRepo(commitish, undefined, owner, repo);
  } else if (
    versionObject.VersionString &&
    validSemVer(versionObject.VersionString)
  ) {
    const version = versionObject.VersionString;
    // v1.1.0 does not contains google proto files in zip
    // See https://github.com/arduino/arduino-cli/issues/2755
    const isV110 = eq(new SemVer(version, { loose: true }), '1.1.0');
    protosFolder = isV110
      ? await getProtosFromRepo(undefined, version)
      : await getProtosFromZip(version);
  } else if (versionObject.Commit) {
    protosFolder = await getProtosFromRepo(versionObject.Commit);
  }

  if (!protosFolder) {
    console.log(`Could not get proto files: missing commitish or version.`);
    process.exit(1);
  }

  const protos = await globProtos(protosFolder);

  if (!protos || protos.length === 0) {
    rmSync(protosFolder, { recursive: true, maxRetries: 5, force: true });
    console.log(`Could not find any .proto files under ${protosFolder}.`);
    process.exit(1);
  }

  console.log('>>> Generating TS/JS API from:');

  const out = path.join(__dirname, '..', 'src', 'node', 'cli-protocol');
  // Must wipe the gen output folder. Otherwise, dangling service implementation remain in IDE2 code,
  // although it has been removed from the proto file.
  // For example, https://github.com/arduino/arduino-cli/commit/50a8bf5c3e61d5b661ccfcd6a055e82eeb510859.
  // rmSync(out, { recursive: true, maxRetries: 5, force: true });
  mkdirSync(out, { recursive: true });

  try {
    // Generate JS code from the `.proto` files.
    exec(
      'grpc_tools_node_protoc',
      [
        `--js_out=import_style=commonjs,binary:${out}`,
        `--grpc_out=generate_package_definition:${out}`,
        '-I',
        protosFolder,
        ...protos,
      ],
      { logStdout: true }
    );

    // Generate the `.d.ts` files for JS.
    exec(
      path.join(protoc, `protoc${platform === 'win32' ? '.exe' : ''}`),
      [
        `--plugin=protoc-gen-ts=${path.resolve(
          __dirname,
          '..',
          'node_modules',
          '.bin',
          `protoc-gen-ts${platform === 'win32' ? '.cmd' : ''}`
        )}`,
        `--ts_out=generate_package_definition:${out}`,
        '-I',
        protosFolder,
        ...protos,
      ],
      { logStdout: true }
    );
  } catch (error) {
    console.log(error);
  } finally {
    rmSync(protosFolder, { recursive: true, maxRetries: 5, force: true });
  }

  console.log('<<< Generation was successful.');
})();
