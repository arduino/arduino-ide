// @ts-check

(async () => {
  const { Octokit } = require('@octokit/rest');

  const octokit = new Octokit({
    userAgent: 'Arduino IDE compose-changelog.js',
  });

  const response = await octokit.rest.repos.listReleases({
    owner: 'arduino',
    repo: 'arduino-ide',
  });

  if (!response || response.status !== 200) {
    console.log('fancù');
    return;
  }
  const releases = response.data;

  let fullChangelog = releases.reduce((acc, item) => {
    return acc + `\n\n${item.body}`;
  }, '');

  fullChangelog = replaceIssueNumber(fullChangelog);
  fullChangelog = replaceIssueLink(fullChangelog);
  fullChangelog = replaceCompareLink(fullChangelog);

  console.log(fullChangelog);
})();

const replaceIssueLink = (str) => {
  const regex =
    /(https:\/\/github\.com\/arduino\/arduino-ide\/(issues|pull)\/(\d*))/gm;
  const substr = `[#$3]($1)`;
  return str.replace(regex, substr);
};

const replaceIssueNumber = (str) => {
  const regex = /#(\d+)/gm;
  const subst = `[#$1](https://github.com/arduino/arduino-ide/pull/$1)`;
  return str.replace(regex, subst);
};

const replaceCompareLink = (str) => {
  const regex =
    /(https:\/\/github.com\/arduino\/arduino-ide\/compare\/(.*))\s/gm;
  const subst = `[\`$2\`]($1)`;
  return str.replace(regex, subst);
};
