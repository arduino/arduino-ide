// @ts-check

const exec = (
  /** @type {string} */ command,
  /** @type {readonly string[]} */ args,
  /** @type {Partial<import('node:child_process').ExecFileSyncOptionsWithStringEncoding> & { logStdout?: boolean }|undefined} */ options = undefined
) => {
  try {
    const stdout = require('node:child_process').execFileSync(command, args, {
      encoding: 'utf8',
      ...(options ?? {}),
    });
    if (options?.logStdout) {
      console.log(stdout.trim());
    }
    return stdout;
  } catch (err) {
    console.log(
      `Failed to execute ${command} with args: ${JSON.stringify(args)}`
    );
    throw err;
  }
};
exports.exec = exec;

/**
 * Clones something from GitHub and builds it with [`Task`](https://taskfile.dev/).
 *
 * @param version {object} the version object.
 * @param destinationPath {string} the absolute path of the output binary. For example, `C:\\folder\\arduino-cli.exe` or `/path/to/arduino-language-server`
 * @param taskName {string} for the CLI logging . Can be `'CLI'` or `'language-server'`, etc.
 */
exports.taskBuildFromGit = (version, destinationPath, taskName) => {
  return buildFromGit('task', version, destinationPath, taskName);
};

/**
 * Clones something from GitHub and builds it with `Golang`.
 *
 * @param version {object} the version object.
 * @param destinationPath {string} the absolute path of the output binary. For example, `C:\\folder\\arduino-cli.exe` or `/path/to/arduino-language-server`
 * @param taskName {string} for the CLI logging . Can be `'CLI'` or `'language-server'`, etc.
 */
exports.goBuildFromGit = (version, destinationPath, taskName) => {
  return buildFromGit('go', version, destinationPath, taskName);
};

/**
 * The `command` must be either `'go'` or `'task'`.
 * @param {string} command
 * @param {{ owner: any; repo: any; commitish: any; }} version
 * @param {string} destinationPath
 * @param {string} taskName
 */
function buildFromGit(command, version, destinationPath, taskName) {
  const fs = require('node:fs');
  const path = require('node:path');
  const temp = require('temp');

  // We assume an object with `owner`, `repo`, commitish?` properties.
  if (typeof version !== 'object') {
    console.log(
      `Expected a \`{ owner, repo, commitish }\` object. Got <${version}> instead.`
    );
  }
  const { owner, repo, commitish } = version;
  if (!owner) {
    console.log(`Could not retrieve 'owner' from ${JSON.stringify(version)}`);
    process.exit(1);
  }
  if (!repo) {
    console.log(`Could not retrieve 'repo' from ${JSON.stringify(version)}`);
    process.exit(1);
  }
  const url = `https://github.com/${owner}/${repo}.git`;
  console.log(
    `Building ${taskName} from ${url}. Commitish: ${
      commitish ? commitish : 'HEAD'
    }`
  );

  if (fs.existsSync(destinationPath)) {
    console.log(
      `Skipping the ${taskName} build because it already exists: ${destinationPath}`
    );
    return;
  }

  const resourcesFolder = path.join(
    __dirname,
    '..',
    'src',
    'node',
    'resources'
  );
  fs.mkdirSync(resourcesFolder, { recursive: true });

  const tempRepoPath = temp.mkdirSync();
  console.log(`>>> Cloning ${taskName} source to ${tempRepoPath}...`);
  exec('git', ['clone', url, tempRepoPath], { logStdout: true });
  console.log(`<<< Cloned ${taskName} repo.`);

  if (commitish) {
    console.log(`>>> Checking out ${commitish}...`);
    exec('git', ['-C', tempRepoPath, 'checkout', commitish], {
      logStdout: true,
    });
    console.log(`<<< Checked out ${commitish}.`);
  }

  exec('git', ['-C', tempRepoPath, 'rev-parse', '--short', 'HEAD'], {
    logStdout: true,
  });

  console.log(`>>> Building the ${taskName}...`);
  exec(command, ['build'], {
    cwd: tempRepoPath,
    encoding: 'utf8',
    logStdout: true,
  });
  console.log(`<<< Done ${taskName} build.`);

  const binName = path.basename(destinationPath);
  if (!fs.existsSync(path.join(tempRepoPath, binName))) {
    console.log(
      `Could not find the ${taskName} at ${path.join(tempRepoPath, binName)}.`
    );
    process.exit(1);
  }

  const binPath = path.join(tempRepoPath, binName);
  console.log(
    `>>> Copying ${taskName} from ${binPath} to ${destinationPath}...`
  );
  fs.copyFileSync(binPath, destinationPath);
  console.log(`<<< Copied the ${taskName}.`);

  console.log(`<<< Verifying ${taskName}...`);
  if (!fs.existsSync(destinationPath)) {
    process.exit(1);
  }
  console.log(`>>> Verified ${taskName}.`);
}
