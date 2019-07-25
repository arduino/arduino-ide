import * as psTree from 'ps-tree';
const kill = require('tree-kill');
const [theiaPid, daemonPid] = process.argv.slice(2).map(id => Number.parseInt(id, 10));

setInterval(() => {
    try {
        // Throws an exception if the Theia process doesn't exist anymore.
        process.kill(theiaPid, 0);
    } catch {
        psTree(daemonPid, function (_, children) {
            for (const { PID } of children) {
                kill(PID);
            }
            kill(daemonPid, () => process.exit());
        });
    }
}, 1000);
