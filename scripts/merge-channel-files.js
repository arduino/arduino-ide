// @ts-check

// The script should be invoked with the path to a folder that contains the two files as an argument. The filenames in the folder should be:
//  - stable-mac-X64.yml
//  - stable-mac-ARM64.yml
// The merged file will be saved to the folder with the name stable-mac.yml and that file can then be uploaded to S3
// The input files will be deleted if the `--no-cleanup` argument is missing.
// Usage `node ./scripts/merge-channel-files.js ./path/to/folder/with/channel/files --no-cleanup`

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2)
if (args.length < 1) {
  console.error('Missing channel files folder path argument.');
  process.exit(1);
}

const [channelFilesFolder,] = args;
// Staging file filename suffixes are named according to `runner.arch`.
// https://docs.github.com/en/actions/learn-github-actions/contexts#runner-context
const x86ChannelFilePath = path.join(channelFilesFolder, 'stable-mac-X64.yml');
const arm64ChannelFilePath = path.join(
  channelFilesFolder,
  'stable-mac-ARM64.yml'
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
  path.join(channelFilesFolder, 'stable-mac.yml'),
  yaml.dump(mergedData, { lineWidth: -1 })
);

// Clean up
if (!process.argv.includes('--no-cleanup')) {
  fs.rmSync(x86ChannelFilePath);
  fs.rmSync(arm64ChannelFilePath);
}
