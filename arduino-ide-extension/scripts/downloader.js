// @ts-check

const fs = require('fs');
const path = require('path');
const decompress = require('decompress');
const unzip = require('decompress-unzip');
const untargz = require('decompress-targz');
const untarbz2 = require('decompress-tarbz2');

process.on('unhandledRejection', (reason) => {
  console.log(String(reason));
  process.exit(1);
});
process.on('uncaughtException', (error) => {
  console.log(String(error));
  process.exit(1);
});

/**
 * @param url {string}        Download URL
 * @param targetFile {string} Path to the file to copy from the decompressed archive
 * @param filePrefix {string} Prefix of the file name found in the archive
 * @param force {boolean}     Whether to download even if the target file exists. `false` by default.
 */
exports.downloadUnzipFile = async (
  url,
  targetFile,
  filePrefix,
  force = false
) => {
  if (fs.existsSync(targetFile) && !force) {
    console.log(`Skipping download because file already exists: ${targetFile}`);
    return;
  }
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });

  const downloads = path.join(__dirname, '..', 'downloads');
  fs.rmSync(targetFile, { recursive: true, force: true });
  fs.rmSync(downloads, { recursive: true, force: true });

  console.log(`>>> Downloading from '${url}'...`);
  const data = await download(url);
  console.log(`<<< Download succeeded.`);

  console.log('>>> Decompressing...');
  const files = await decompress(data, downloads, {
    plugins: [unzip(), untargz(), untarbz2()],
  });
  if (files.length === 0) {
    console.log('Error ocurred while decompressing the archive.');
    process.exit(1);
  }
  const fileIndex = files.findIndex((f) => f.path.startsWith(filePrefix));
  if (fileIndex === -1) {
    console.log(
      `The downloaded artifact does not contain any file with prefix ${filePrefix}.`
    );
    process.exit(1);
  }
  console.log('<<< Decompressing succeeded.');

  fs.renameSync(path.join(downloads, files[fileIndex].path), targetFile);
  if (!fs.existsSync(targetFile)) {
    console.log(`Could not find file: ${targetFile}`);
    process.exit(1);
  }
  console.log(`Done: ${targetFile}`);
};

/**
 * @param url {string}        Download URL
 * @param targetDir {string}  Directory into which to decompress the archive
 * @param targetFile {string} Path to the main file expected after decompressing
 * @param force {boolean}     Whether to download even if the target file exists
 * @param decompressOptions {import('decompress').DecompressOptions|undefined} [decompressOptions]
 */
exports.downloadUnzipAll = async (
  url,
  targetDir,
  targetFile,
  force,
  decompressOptions = undefined
) => {
  if (fs.existsSync(targetFile) && !force) {
    console.log(`Skipping download because file already exists: ${targetFile}`);
    return;
  }
  fs.mkdirSync(targetDir, { recursive: true });

  console.log(`>>> Downloading from '${url}'...`);
  const data = await download(url);
  console.log(`<<< Download succeeded.`);

  console.log('>>> Decompressing...');
  let options = {
    plugins: [unzip(), untargz(), untarbz2()],
  };
  if (decompressOptions) {
    options = Object.assign(options, decompressOptions);
  }
  const files = await decompress(data, targetDir, options);
  if (files.length === 0) {
    console.log('Error ocurred while decompressing the archive.');
    process.exit(1);
  }
  console.log('<<< Decompressing succeeded.');

  if (!fs.existsSync(targetFile)) {
    console.log(`Could not find file: ${targetFile}`);
    process.exit(1);
  }
  console.log(`Done: ${targetFile}`);
};

/**
 * @param {string} url
 * @returns {Promise<import('node:buffer').Buffer>}
 */
async function download(url) {
  const { default: download } = await import('@xhmikosr/downloader');
  /** @type {import('node:buffer').Buffer} */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const data = await download(url);
  return data;
}
