/**
 * Clones something from GitHub and builds it with `Golang`.
 *
 * @param version {object} the version object.
 * @param destinationPath {string} the absolute path of the output binary. For example, `C:\\folder\\arduino-cli.exe` or `/path/to/arduino-language-server`
 * @param taskName {string} for the CLI logging . Can be `'CLI'` or `'language-server'`, etc.
 */
exports.goBuildFromGit = (version, destinationPath, taskName) => {
  const fs = require('fs');
  const path = require('path');
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
  if (shell.exec(`git clone ${url} ${tempRepoPath}`).code !== 0) {
    shell.exit(1);
  }
  shell.echo(`<<< Cloned ${taskName} repo.`);

  if (commitish) {
    shell.echo(`>>> Checking out ${commitish}...`);
    if (shell.exec(`git -C ${tempRepoPath} checkout ${commitish}`).code !== 0) {
      shell.exit(1);
    }
    shell.echo(`<<< Checked out ${commitish}.`);
  }

  shell.echo(`>>> Building the ${taskName}...`);
  if (shell.exec('go build', { cwd: tempRepoPath }).code !== 0) {
    shell.exit(1);
  }
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
};
