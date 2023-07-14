// @ts-check
'use strict';

// const isElectronPublish = false; // TODO: support auto-updates
const isNightly = process.env.IS_NIGHTLY === 'true';
const isRelease = process.env.IS_RELEASE === 'true';

module.exports = { isNightly, isRelease };
