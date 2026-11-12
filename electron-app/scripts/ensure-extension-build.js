// @ts-check
'use strict';

const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const extensionRoot = join(__dirname, '..', '..', 'arduino-ide-extension');
const parcelWatcherEntryPoint = join(
  extensionRoot,
  'lib',
  'node',
  'theia',
  'filesystem',
  'parcel-watcher',
  'index.js'
);

if (existsSync(parcelWatcherEntryPoint)) {
  process.exit(0);
}

const result = spawnSync('yarn', ['build'], {
  cwd: extensionRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
