// @ts-check

(async () => {

    const DEFAULT_VERSION = 'nightly'; // '0.3.7-alpha.preview';

    const os = require('os');
    const path = require('path');
    const { v4 } = require('uuid');
    const shell = require('shelljs');
    shell.env.PATH = `${shell.env.PATH}${path.delimiter}${path.join(__dirname, '..', 'node_modules', '.bin')}`;
    const yargs = require('yargs')
        .option('cli-version', {
            alias: 'cv',
            default: DEFAULT_VERSION,
            choices: [
                // 'latest', // TODO: How do we get the source for `latest`. Currently, `latest` is the `0.3.7-alpha.preview`.
                'nightly'
            ],
            describe: `The version of the 'arduino-cli' to download. Specify either an existing version or use 'nightly'. Defaults to ${DEFAULT_VERSION}.`
        })
        .version(false).parse();

    const version = yargs['cli-version'];
    if (version !== 'nightly') {
        shell.echo(`Only 'nightly' version is supported.`);
        shell.exit(1);
    }
    const repository = path.join(os.tmpdir(), `${v4()}-arduino-cli`);
    if (shell.mkdir('-p', repository).code !== 0) {
        shell.exit(1);
    }

    if (shell.exec(`git clone https://github.com/arduino/arduino-cli.git ${repository}`).code !== 0) {
        shell.exit(1);
    }
    if (version !== 'nightly') {
        if (shell.exec(`git -C ${repository} checkout tags/${version} -b ${version}`).code !== 0) {
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
    // Generate JS code from the `.proto` files.
    if (shell.exec(`grpc_tools_node_protoc \
--js_out=import_style=commonjs,binary:${out} \
--grpc_out=${out} \
--plugin=protoc-gen-grpc=${plugin} \
-I ${rpc} \
${path.join(rpc, '/**/*.proto')}`).code !== 0) {
        shell.exit(1);
    }

    // Generate the `.d.ts` files for JS.
    if (shell.exec(`protoc \
--plugin=protoc-gen-ts=${path.resolve(__dirname, '..', 'node_modules', '.bin', 'protoc-gen-ts')} \
--ts_out=${out} \
-I ${rpc} \
${path.join(rpc, '/**/*.proto')}`).code !== 0) {
        shell.exit(1);
    }

    const { patch } = require('./patch-grpc-js');
    patch([out])
    shell.echo('Done.');

})();