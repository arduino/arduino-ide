// @ts-check

// The version to use.
const version = '1.9.0';

(async () => {

    const os = require('os');
    const path = require('path');
    const shell = require('shelljs');
    const { v4 } = require('uuid');

    const repository = path.join(os.tmpdir(), `${v4()}-arduino-examples`);
    if (shell.mkdir('-p', repository).code !== 0) {
        shell.exit(1);
        process.exit(1);
    }

    if (shell.exec(`git clone https://github.com/arduino/arduino-examples.git ${repository}`).code !== 0) {
        shell.exit(1);
        process.exit(1);
    }

    if (shell.exec(`git -C ${repository} checkout tags/${version} -b ${version}`).code !== 0) {
        shell.exit(1);
        process.exit(1);
    }

    const destination = path.join(__dirname, '..', 'Examples');
    shell.mkdir('-p', destination);
    shell.cp('-fR', path.join(repository, 'examples', '*'), destination);

})();
