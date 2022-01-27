// @ts-check


(async () => {
  const { Octokit } = require('@octokit/rest');
  const fs = require("fs");
  const path = require("path");

  const octokit = new Octokit({
    userAgent: 'Arduino IDE compose-changelog.js',
  });

  const response = await octokit.rest.repos.listReleases({
    owner: 'arduino',
    repo: 'arduino-ide',
  }).catch(err => {
    console.error(err);
    process.exit(1);
  })

  const releases = response.data;

  let fullChangelog = releases.reduce((acc, item) => {
    // Process each line separately
    const body = item.body.split('\n').map(processLine).join('\n')
    // item.name is the name of the release changelog
    return acc + `# ${item.name}\n\n${body}\n\n---\n\n`;
  }, '');

  const args = process.argv.slice(2)
  if (args.length == 0) {
    console.error("Missing argument to destination file")
    process.exit(1)
  }
  const changelogFile = path.resolve(args[0]);

  await fs.writeFile(
    changelogFile,
    fullChangelog,
    {
      flag: "w+",
    },
    err => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log("Changelog written to", changelogFile);
    }
  )
})();


// processLine applies different substitutions to line string.
// We're assuming that there are no more than one substitution
// per line to be applied.
const processLine = (line) => {
  // Check if a link with one of the following format exists:
  // * [#123](https://github.com/arduino/arduino-ide/pull/123)
  // * [#123](https://github.com/arduino/arduino-ide/issues/123)
  // * [#123](https://github.com/arduino/arduino-ide/pull/123/)
  // * [#123](https://github.com/arduino/arduino-ide/issues/123/)
  // If it does return the line as is.
  let r = /(\(|\[)#\d+(\)|\])(\(|\[)https:\/\/github\.com\/arduino\/arduino-ide\/(pull|issues)\/(\d+)\/?(\)|\])/gm;
  if (r.test(line)) {
    return line;
  }

  // Check if a issue or PR link with the following format exists:
  // * #123
  // If it does it's changed to:
  // * [#123](https://github.com/arduino/arduino-ide/pull/123)
  r = /#(\d+)/gm;
  if (r.test(line)) {
    return line.replace(r, `[#$1](https://github.com/arduino/arduino-ide/pull/$1)`)
  }

  // Check if a link with one of the following format exists:
  // * https://github.com/arduino/arduino-ide/pull/123
  // * https://github.com/arduino/arduino-ide/issues/123
  // * https://github.com/arduino/arduino-ide/pull/123/
  // * https://github.com/arduino/arduino-ide/issues/123/
  // If it does it's changed respectively to:
  // * [#123](https://github.com/arduino/arduino-ide/pull/123)
  // * [#123](https://github.com/arduino/arduino-ide/issues/123)
  // * [#123](https://github.com/arduino/arduino-ide/pull/123/)
  // * [#123](https://github.com/arduino/arduino-ide/issues/123/)
  r = /(https:\/\/github\.com\/arduino\/arduino-ide\/(pull|issues)\/(\d+)\/?)/gm;
  if (r.test(line)) {
    return line.replace(r, `[#$3]($1)`);
  }

  // Check if a link with the following format exists:
  // * https://github.com/arduino/arduino-ide/compare/2.0.0-rc2...2.0.0-rc3
  // * https://github.com/arduino/arduino-ide/compare/2.0.0-rc2...2.0.0-rc3/
  // If it does it's changed to:
  // * [`2.0.0-rc2...2.0.0-rc3`](https://github.com/arduino/arduino-ide/compare/2.0.0-rc2...2.0.0-rc3)
  r = /(https:\/\/github\.com\/arduino\/arduino-ide\/compare\/([^\/]*))\/?\s?/gm;
  if (r.test(line)) {
    return line.replace(r, '[`$2`]($1)');;
  }

  // If nothing matches just return the line as is
  return line;
}
