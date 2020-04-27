import * as os from 'os';
import { expect, use } from 'chai';
import { getExecPath } from '../../node/exec-util'

use(require('chai-string'));

describe('getExecPath', () => {

    it('should resolve arduino-cli', async () => {
        const actual = await getExecPath('arduino-cli', onError, 'version');
        const expected = os.platform() === 'win32' ? '\\arduino-cli.exe' : '/arduino-cli';
        expect(actual).to.endsWith(expected);
    });

    it('should resolve arduino-language-server', async () => {
        const actual = await getExecPath('arduino-language-server');
        const expected = os.platform() === 'win32' ? '\\arduino-language-server.exe' : '/arduino-language-server';
        expect(actual).to.endsWith(expected);
    });

    it('should resolve clangd', async () => {
        const actual = await getExecPath('clangd', onError, '--version', os.platform() !== 'win32');
        const expected = os.platform() === 'win32' ? '\\clangd.exe' : '/clangd';
        expect(actual).to.endsWith(expected);
    });

    function onError(error: Error): void {
        console.error(error);
    }

});
