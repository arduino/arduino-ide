// @ts-check

(async () => {
  const os = require('node:os');
  const path = require('node:path');
  const { mkdirSync, promises: fs, rmSync } = require('node:fs');
  const { exec } = require('./utils');
  const { glob } = require('glob');
  const { SemVer, gte, valid: validSemVer, gt } = require('semver');
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
  const version = versionObject.VersionString;

  // Clone the repository and check out the tagged version
  // Return folder with proto files
  async function getProtoPath(forceCliVersion) {
    const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'arduino-cli-'));

    const url = `https://github.com/${owner}/${repo}.git`;
    console.log(`>>> Cloning repository from '${url}'...`);
    exec('git', ['clone', url, repository], { logStdout: true });
    console.log(`<<< Repository cloned.`);

    let cliVersion = forceCliVersion || version;
    if (validSemVer(cliVersion)) {
      // https://github.com/arduino/arduino-cli/pull/2374
      if (
        gte(new SemVer(version, { loose: true }), new SemVer('0.35.0-rc.1'))
      ) {
        cliVersion = `v${cliVersion}`;
      }
      console.log(`>>> Checking out tagged version: '${cliVersion}'...`);
      exec('git', ['-C', repository, 'fetch', '--all', '--tags'], {
        logStdout: true,
      });
      exec(
        'git',
        ['-C', repository, 'checkout', `tags/${cliVersion}`, '-b', cliVersion],
        { logStdout: true }
      );
      console.log(`<<< Checked out tagged version: '${cliVersion}'.`);
    } else if (forceCliVersion) {
      console.log(`WARN: invalid semver: '${forceCliVersion}'.`);
      // If the forced version is invalid, do not proceed with fallbacks.
      return undefined;
    } else if (commitish) {
      console.log(
        `>>> Checking out commitish from 'package.json': '${commitish}'...`
      );
      exec('git', ['-C', repository, 'checkout', commitish], {
        logStdout: true,
      });
      console.log(
        `<<< Checked out commitish from 'package.json': '${commitish}'.`
      );
    } else if (versionObject.Commit) {
      console.log(
        `>>> Checking out commitish from the CLI: '${versionObject.Commit}'...`
      );
      exec('git', ['-C', repository, 'checkout', versionObject.Commit], {
        logStdout: true,
      });
      console.log(
        `<<< Checked out commitish from the CLI: '${versionObject.Commit}'.`
      );
    } else {
      console.log(
        `WARN: no 'git checkout'. Generating from the HEAD revision.`
      );
    }

    return path.join(repository, 'rpc');
  }

  const protoPath = await getProtoPath();

  if (!protoPath) {
    console.log(`Could not find the proto files folder.`);
    process.exit(1);
  }

  console.log('>>> Generating TS/JS API from:');
  exec('git', ['-C', protoPath, 'rev-parse', '--abbrev-ref', 'HEAD'], {
    logStdout: true,
  });

  const out = path.join(__dirname, '..', 'src', 'node', 'cli-protocol');
  // Must wipe the gen output folder. Otherwise, dangling service implementation remain in IDE2 code,
  // although it has been removed from the proto file.
  // For example, https://github.com/arduino/arduino-cli/commit/50a8bf5c3e61d5b661ccfcd6a055e82eeb510859.
  rmSync(out, { recursive: true, maxRetries: 5, force: true });
  mkdirSync(out, { recursive: true });

  if (gt(new SemVer(version, { loose: true }), new SemVer('1.0.4'))) {
    // Patch for https://github.com/arduino/arduino-cli/issues/2755
    // Credit https://github.com/dankeboy36/ardunno-cli-gen/pull/9/commits/64a5ac89aae605249261c8ceff7255655ecfafca
    // Download the 1.0.4 version and use the missing google/rpc/status.proto file.
    console.log('<<< Generating missing google proto files');
    const v104ProtoPath = await getProtoPath('1.0.4');
    if (!v104ProtoPath) {
      console.log(`Could not find the proto files folder for version 1.0.4.`);
      process.exit(1);
    }
    await fs.cp(
      path.join(v104ProtoPath, 'google'),
      path.join(protoPath, 'google'),
      {
        recursive: true,
      }
    );
    console.log(`>>> Generated missing google file`);
  }

  let protos = [];
  try {
    const matches = await glob('**/*.proto', { cwd: protoPath });
    protos = matches.map((filename) => path.join(protoPath, filename));
  } catch (error) {
    console.log(error.stack ?? error.message);
  }

  if (!protos || protos.length === 0) {
    console.log(`Could not find any .proto files under ${protoPath}.`);
    process.exit(1);
  }

  // Generate JS code from the `.proto` files.
  exec(
    'grpc_tools_node_protoc',
    [
      `--js_out=import_style=commonjs,binary:${out}`,
      `--grpc_out=generate_package_definition:${out}`,
      '-I',
      protoPath,
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
      protoPath,
      ...protos,
    ],
    { logStdout: true }
  );

  console.log('<<< Generation was successful.');
})();
