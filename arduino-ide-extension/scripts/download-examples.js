// @ts-check

// The version to use.
const version = '1.10.0';

(async () => {
  const os = require('node:os');
  const { existsSync, promises: fs } = require('node:fs');
  const path = require('node:path');
  const shell = require('shelljs');
  const { v4 } = require('uuid');
  const { exec } = require('./utils');

  const destination = path.join(
    __dirname,
    '..',
    'src',
    'node',
    'resources',
    'Examples'
  );
  if (existsSync(destination)) {
    shell.echo(
      `Skipping Git checkout of the examples because the repository already exists: ${destination}`
    );
    return;
  }

  const repository = path.join(os.tmpdir(), `${v4()}-arduino-examples`);
  if (shell.mkdir('-p', repository).code !== 0) {
    shell.exit(1);
  }

  exec(
    'git',
    ['clone', 'https://github.com/arduino/arduino-examples.git', repository],
    shell
  );

  exec(
    'git',
    ['-C', repository, 'checkout', `tags/${version}`, '-b', version],
    shell
  );

  shell.mkdir('-p', destination);
  shell.cp('-fR', path.join(repository, 'examples', '*'), destination);

  const isSketch = async (pathLike) => {
    try {
      const names = await fs.readdir(pathLike);
      const dirName = path.basename(pathLike);
      return names.indexOf(`${dirName}.ino`) !== -1;
    } catch (e) {
      if (e.code === 'ENOTDIR') {
        return false;
      }
      throw e;
    }
  };
  const examples = [];
  const categories = await fs.readdir(destination);
  const visit = async (pathLike, container) => {
    const stat = await fs.lstat(pathLike);
    if (stat.isDirectory()) {
      if (await isSketch(pathLike)) {
        container.sketches.push({
          name: path.basename(pathLike),
          relativePath: path.relative(destination, pathLike),
        });
      } else {
        const names = await fs.readdir(pathLike);
        for (const name of names) {
          const childPath = path.join(pathLike, name);
          if (await isSketch(childPath)) {
            container.sketches.push({
              name,
              relativePath: path.relative(destination, childPath),
            });
          } else {
            const child = {
              label: name,
              children: [],
              sketches: [],
            };
            container.children.push(child);
            await visit(childPath, child);
          }
        }
      }
    }
  };
  for (const category of categories) {
    const example = {
      label: category,
      children: [],
      sketches: [],
    };
    await visit(path.join(destination, category), example);
    examples.push(example);
  }
  await fs.writeFile(
    path.join(destination, 'examples.json'),
    JSON.stringify(examples, null, 2),
    { encoding: 'utf8' }
  );
  shell.echo(`Generated output to ${path.join(destination, 'examples.json')}`);
})();
