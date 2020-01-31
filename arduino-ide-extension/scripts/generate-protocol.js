// @ts-check

(async () => {

    const os = require('os');
    const path = require('path');
    const glob = require('glob');
    const { v4 } = require('uuid');
    const shell = require('shelljs');
    const protoc = path.dirname(require('protoc/protoc'));
    shell.env.PATH = `${shell.env.PATH}${path.delimiter}${protoc}`;
    shell.env.PATH = `${shell.env.PATH}${path.delimiter}${path.join(__dirname, '..', 'node_modules', '.bin')}`;

    const repository = path.join(os.tmpdir(), `${v4()}-arduino-cli`);
    if (shell.mkdir('-p', repository).code !== 0) {
        shell.exit(1);
    }

    if (shell.exec(`git clone https://github.com/arduino/arduino-cli.git ${repository}`).code !== 0) {
        shell.exit(1);
    }

    const { platform } = process;
    const build = path.join(__dirname, '..', 'build');
    const cli = path.join(build, `arduino-cli${platform === 'win32' ? '.exe' : ''}`);
    const rawVersion = shell.exec(`${cli} version`).trim();
    if (!rawVersion) {
        shell.echo(`Could not retrieve the CLI version from ${cli}.`);
        shell.exit(1);
    }
    const version = rawVersion.substring(rawVersion.lastIndexOf('Commit:') + 'Commit:'.length).trim();
    if (version) {
        if (shell.exec(`git -C ${repository} checkout ${version} -b ${version}`).code !== 0) {
            shell.exit(1);
        }
    }

    shell.echo('Generating TS/JS API from:');
    if (shell.exec(`git -C ${repository} rev-parse --abbrev-ref HEAD`).code !== 0) {
        shell.exit(1);
    }
    if (shell.exec(`git -C ${repository} rev-parse --short HEAD`).code !== 0) {
        shell.exit(1);
    }

    const pluginExec = shell.which('grpc_tools_node_protoc_plugin');
    if (!pluginExec || pluginExec.code !== 0) {
        shell.exit(1);
    }
    const plugin = pluginExec.stdout.trim();

    const rpc = path.join(repository, 'rpc');
    const out = path.join(__dirname, '..', 'src', 'node', 'cli-protocol');
    shell.mkdir('-p', out);

    const protos = await new Promise(resolve =>
        glob('**/*.proto', { cwd: rpc }, (error, matches) => {
            if (error) {
                shell.echo(error.stack);
                resolve([]);
                return;
            }
            resolve(matches.map(filename => path.join(rpc, filename)));
        }));
    if (!protos || protos.length === 0) {
        shell.echo(`Could not find any .proto files under ${rpc}.`);
        shell.exit(1);
    }

    // Generate JS code from the `.proto` files.
    if (shell.exec(`grpc_tools_node_protoc \
--js_out=import_style=commonjs,binary:${out} \
--grpc_out=${out} \
--plugin=protoc-gen-grpc=${plugin} \
-I ${rpc} \
${protos.join(' ')}`).code !== 0) {
        shell.exit(1);
    }

    // Generate the `.d.ts` files for JS.
    if (shell.exec(`protoc \
--plugin=protoc-gen-ts=${path.resolve(__dirname, '..', 'node_modules', '.bin', `protoc-gen-ts${platform === 'win32' ? '.cmd' : ''}`)} \
--ts_out=${out} \
-I ${rpc} \
${protos.join(' ')}`).code !== 0) {
        shell.exit(1);
    }

    const { patch } = require('./patch-grpc-js');
    patch([out])
    shell.echo('Done.');

})();
