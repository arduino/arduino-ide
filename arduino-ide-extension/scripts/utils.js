// @ts-check

const exec = (
  /** @type {string} */ command,
  /** @type {readonly string[]} */ args,
  /** @type {import('shelljs')|undefined}*/ shell = undefined,
  /** @type {import('node:child_process').ExecFileSyncOptionsWithStringEncoding|undefined} */ options = undefined
) => {
  try {
    const stdout = require('node:child_process').execFileSync(
      command,
      args,
      options ? options : { encoding: 'utf8' }
    );
    if (shell) {
      shell.echo(stdout.trim());
    }
    return stdout;
  } catch (err) {
    if (shell) {
      shell.echo(err instanceof Error ? err.message : String(err));
      shell.exit(1);
    }
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
  const shell = require('shelljs');

  // We assume an object with `owner`, `repo`, commitish?` properties.
  if (typeof version !== 'object') {
    shell.echo(
      `Expected a \`{ owner, repo, commitish }\` object. Got <${version}> instead.`
    );
  }
  const { owner, repo, commitish } = version;
  if (!owner) {
    shell.echo(`Could not retrieve 'owner' from ${JSON.stringify(version)}`);
    shell.exit(1);
  }
  if (!repo) {
    shell.echo(`Could not retrieve 'repo' from ${JSON.stringify(version)}`);
    shell.exit(1);
  }
  const url = `https://github.com/${owner}/${repo}.git`;
  shell.echo(
    `Building ${taskName} from ${url}. Commitish: ${
      commitish ? commitish : 'HEAD'
    }`
  );

  if (fs.existsSync(destinationPath)) {
    shell.echo(
      `Skipping the ${taskName} build because it already exists: ${destinationPath}`
    );
    return;
  }

  const buildFolder = path.join(__dirname, '..', 'build');
  if (shell.mkdir('-p', buildFolder).code !== 0) {
    shell.echo('Could not create build folder.');
    shell.exit(1);
  }

  const tempRepoPath = temp.mkdirSync();
  shell.echo(`>>> Cloning ${taskName} source to ${tempRepoPath}...`);
  exec('git', ['clone', url, tempRepoPath], shell);
  shell.echo(`<<< Cloned ${taskName} repo.`);

  if (commitish) {
    shell.echo(`>>> Checking out ${commitish}...`);
    exec('git', ['-C', tempRepoPath, 'checkout', commitish], shell);
    shell.echo(`<<< Checked out ${commitish}.`);
  }

  shell.echo(`>>> Building the ${taskName}...`);
  exec(command, ['build'], shell, { cwd: tempRepoPath, encoding: 'utf8' });
  shell.echo(`<<< Done ${taskName} build.`);

  const binName = path.basename(destinationPath);
  if (!fs.existsSync(path.join(tempRepoPath, binName))) {
    shell.echo(
      `Could not find the ${taskName} at ${path.join(tempRepoPath, binName)}.`
    );
    shell.exit(1);
  }

  const binPath = path.join(tempRepoPath, binName);
  shell.echo(
    `>>> Copying ${taskName} from ${binPath} to ${destinationPath}...`
  );
  if (shell.cp(binPath, destinationPath).code !== 0) {
    shell.exit(1);
  }
  shell.echo(`<<< Copied the ${taskName}.`);

  shell.echo(`<<< Verifying ${taskName}...`);
  if (!fs.existsSync(destinationPath)) {
    shell.exit(1);
  }
  shell.echo(`>>> Verified ${taskName}.`);
}
