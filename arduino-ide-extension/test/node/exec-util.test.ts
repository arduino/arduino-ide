import * as os from 'os';
import { expect, use } from 'chai';
import { NullLogger } from './logger';
import { getExecPath } from '../../lib/node/exec-util'

use(require('chai-string'));

describe('getExecPath', () => {
    it('should resolve arduino-cli', async () => {
        const path = await getExecPath('arduino-cli', new NullLogger(), 'version');
        if (os.platform() === 'win32')
            expect(path).to.endsWith('\\arduino-cli.exe');
        else
            expect(path).to.endsWith('/arduino-cli');
    });

    it('should resolve arduino-language-server', async () => {
        const path = await getExecPath('arduino-language-server', new NullLogger());
        if (os.platform() === 'win32')
            expect(path).to.endsWith('\\arduino-language-server.exe');
        else
            expect(path).to.endsWith('/arduino-language-server');
    });

    it('should resolve clangd', async () => {
        const path = await getExecPath('clangd', new NullLogger(), '--version', os.platform() !== 'win32');
        if (os.platform() === 'win32')
            expect(path).to.endsWith('\\clangd.exe');
        else
            expect(path).to.endsWith('/clangd');
    });
});
