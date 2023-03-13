import psTree from 'ps-tree';
import kill from 'tree-kill';
const [theiaPid, daemonPid] = process.argv
  .slice(2)
  .map((id) => Number.parseInt(id, 10));

setInterval(() => {
  try {
    // Throws an exception if the Theia process doesn't exist anymore.
    process.kill(theiaPid, 0);
  } catch {
    psTree(daemonPid, function (_, children) {
      for (const { PID } of children) {
        const parsedPid = Number.parseInt(PID, 10);
        if (!Number.isNaN(parsedPid)) {
          kill(parsedPid);
        }
      }
      kill(daemonPid, () => process.exit());
    });
  }
}, 1000);
