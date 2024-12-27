// @ts-check

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(
    `Usage:
merge-channel-files.js [FLAG]...

Merge the "channel update info files" used by electron-updater.

Flags:
      --channel <name>     The name of the update channel.
  -h, --help               Print help for the script
      --input <path>       The path of the folder that contains the files to merge.
`
  );
  process.exit(0);
}

const channelFlagIndex = process.argv.indexOf('--channel');
if (channelFlagIndex < 0) {
  console.error('Missing required --channel flag');
  process.exit(1);
}
const channel = process.argv[channelFlagIndex + 1];
if (!channel) {
  console.error('--channel value must be set');
  process.exit(1);
}

const inputFlagIndex = process.argv.indexOf('--input');
if (inputFlagIndex < 0) {
  console.error('Missing required --input flag');
  process.exit(1);
}
const channelFilesFolder = process.argv[inputFlagIndex + 1];
if (!channelFilesFolder) {
  console.error('--input value must be set');
  process.exit(1);
}

// Staging file filename suffixes are named according to `runner.arch`.
// https://docs.github.com/en/actions/learn-github-actions/contexts#runner-context
const x86ChannelFilePath = path.join(
  channelFilesFolder,
  channel + '-mac-X64.yml'
);
const arm64ChannelFilePath = path.join(
  channelFilesFolder,
  channel + '-mac-ARM64.yml'
);

const x86Data = yaml.load(
  fs.readFileSync(x86ChannelFilePath, { encoding: 'utf8' })
);
const arm64Data = yaml.load(
  fs.readFileSync(arm64ChannelFilePath, { encoding: 'utf8' })
);

const mergedData = x86Data;
mergedData['files'] = mergedData['files'].concat(arm64Data['files']);

fs.writeFileSync(
  path.join(channelFilesFolder, channel + '-mac.yml'),
  yaml.dump(mergedData, { lineWidth: -1 })
);

// Clean up by removing staging files.
fs.rmSync(x86ChannelFilePath);
fs.rmSync(arm64ChannelFilePath);
