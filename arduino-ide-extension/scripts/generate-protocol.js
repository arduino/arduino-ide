// @ts-check

const path = require('node:path');
const fs = require('node:fs/promises');
const { exec } = require('./utils');

const out = path.join(__dirname, '..', 'src', 'node', 'cli-api');
const entry = path.join(out, 'index.ts');

function generate() {
  const { generate } = require('ardunno-cli-gen');
  /** @type {string|{owner: string, repo: string, commitish: string}} */
  const version = require('../package.json').arduino['arduino-cli'].version;
  let src;
  if (typeof version === 'object') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    src = `${version.owner}/${version.repo}#${version.commitish}`;
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    src = version;
  }
  return generate({ src, out, force: true });
}

async function index() {
  const tracked = require('temp').track();
  const tempPath = tracked.mkdirSync();
  const ctiignore = {
    '**/*.ts': ['ServerStreamingMethodResult'],
  };
  const ctiignorePath = path.join(tempPath, '.ctiignore');
  await writeJSONFile(ctiignorePath, ctiignore);
  try {
    exec('npx', [
      'ctix',
      'single',
      '--project',
      path.join(__dirname, '..', 'tsconfig.json'),
      '--startAt',
      out,
      '--output',
      entry,
      '--overwrite',
      '--ignoreFile',
      ctiignorePath,
      '--noBackup',
    ]);
  } finally {
    tracked.cleanupSync();
  }
}

function patch() {
  return exec('npx', [
    'replace-in-files',
    '--string',
    ' type ',
    '--replacement',
    '',
    entry,
  ]);
}

function format() {
  return exec('npx', ['prettier', '--write', out]);
}

async function run() {
  await generate();
  await index();
  patch();
  format();
}
/**
 * @param {string} filePath
 * @param {object} object
 * @returns {Promise<unknown>}
 */
async function writeJSONFile(filePath, object) {
  return fs.writeFile(filePath, JSON.stringify(object, null, 2), {
    encoding: 'utf8',
  });
}

run();
