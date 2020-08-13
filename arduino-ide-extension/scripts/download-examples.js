// @ts-check

(async () => {

    const os = require('os');
    const path = require('path');
    const shell = require('shelljs');
    const { v4 } = require('uuid');

    const repository = path.join(os.tmpdir(), `${v4()}-arduino-examples`);
    if (shell.mkdir('-p', repository).code !== 0) {
        shell.exit(1);
    }

    if (shell.exec(`git clone https://github.com/arduino/arduino.git --depth 1 ${repository}`).code !== 0) {
        shell.exit(1);
    }

    const destination = path.join(__dirname, '..', 'Examples');
    shell.mkdir('-p', destination);
    shell.cp('-fR', path.join(repository, 'build', 'shared', 'examples', '*'), destination);

})();
