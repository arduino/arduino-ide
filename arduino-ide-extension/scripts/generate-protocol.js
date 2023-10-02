// @ts-check

(async () => {
  const os = require('node:os');
  const path = require('node:path');
  const { mkdirSync, promises: fs } = require('node:fs');
  const { exec } = require('./utils');
  const glob = require('glob');
  const protoc = path.dirname(require('protoc/protoc'));

  const repository = await fs.mkdtemp(path.join(os.tmpdir(), 'arduino-cli-'));

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

  const url = `https://github.com/${owner}/${repo}.git`;
  console.log(`>>> Cloning repository from '${url}'...`);
  exec('git', ['clone', url, repository], { logStdout: true });
  console.log(`<<< Repository cloned.`);

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
  if (
    version &&
    !version.startsWith('nightly-') &&
    version !== '0.0.0-git' &&
    version !== 'git-snapshot'
  ) {
    console.log(`>>> Checking out tagged version: '${version}'...`);
    exec('git', ['-C', repository, 'fetch', '--all', '--tags'], {
      logStdout: true,
    });
    exec(
      'git',
      ['-C', repository, 'checkout', `tags/${version}`, '-b', version],
      { logStdout: true }
    );
    console.log(`<<< Checked out tagged version: '${version}'.`);
  } else if (commitish) {
    console.log(
      `>>> Checking out commitish from 'package.json': '${commitish}'...`
    );
    exec('git', ['-C', repository, 'checkout', commitish], { logStdout: true });
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
    console.log(`WARN: no 'git checkout'. Generating from the HEAD revision.`);
  }

  console.log('>>> Generating TS/JS API from:');
  exec('git', ['-C', repository, 'rev-parse', '--abbrev-ref', 'HEAD'], {
    logStdout: true,
  });

  const rpc = path.join(repository, 'rpc');
  const out = path.join(__dirname, '..', 'src', 'node', 'cli-protocol');
  mkdirSync(out, { recursive: true });

  const protos = await new Promise((resolve) =>
    glob('**/*.proto', { cwd: rpc }, (error, matches) => {
      if (error) {
        console.log(error.stack ?? error.message);
        resolve([]);
        return;
      }
      resolve(matches.map((filename) => path.join(rpc, filename)));
    })
  );
  if (!protos || protos.length === 0) {
    console.log(`Could not find any .proto files under ${rpc}.`);
    process.exit(1);
  }

  // Generate JS code from the `.proto` files.
  exec(
    'grpc_tools_node_protoc',
    [
      `--js_out=import_style=commonjs,binary:${out}`,
      `--grpc_out=generate_package_definition:${out}`,
      '-I',
      rpc,
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
      rpc,
      ...protos,
    ],
    { logStdout: true }
  );

  console.log('<<< Generation was successful.');
})();
