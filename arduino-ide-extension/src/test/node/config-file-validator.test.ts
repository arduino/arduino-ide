import { expect } from 'chai'
import { safeLoad } from 'js-yaml';
import { ArduinoDaemonImpl } from '../../node/arduino-daemon-impl';
import { ConfigFileValidator } from '../../node/config-file-validator';
import { spawnCommand } from '../../node/exec-util';

class MockConfigFileValidator extends ConfigFileValidator {

    protected async isValidPath(path: string): Promise<boolean> {
        if (path.endsWith('!invalid')) {
            return false;
        }
        return super.isValidPath(path);
    }

}

describe('config-file-validator', () => {

    const testMe = new MockConfigFileValidator();

    it('valid - default', async () => {
        const config = await defaultConfig();
        const result = await testMe.validate(config);
        // tslint:disable-next-line:no-unused-expression
        expect(result).to.be.true;
    });

    it("valid - no 'board_manager'", async () => {
        const config = await defaultConfig();
        delete config.board_manager;
        const result = await testMe.validate(config);
        // tslint:disable-next-line:no-unused-expression
        expect(result).to.be.true;
    });

    it("valid - no 'board_manager.additional_urls'", async () => {
        const config = await defaultConfig();
        delete config.board_manager.additional_urls;
        const result = await testMe.validate(config);
        // tslint:disable-next-line:no-unused-expression
        expect(result).to.be.true;
    });

    it("invalid - no 'directories.data'", async () => {
        const config = await defaultConfig();
        delete config.directories.data;
        const result = await testMe.validate(config);
        // tslint:disable-next-line:no-unused-expression
        expect(result).to.be.false;
    });

    it("invalid - 'directories.data' is a empty string", async () => {
        const config = await defaultConfig();
        config.directories.data = '';
        const result = await testMe.validate(config);
        // tslint:disable-next-line:no-unused-expression
        expect(result).to.be.false;
    });

    it("invalid - 'directories.data' is contains invalid chars", async () => {
        const config = await defaultConfig();
        config.directories.data = '!invalid';
        const result = await testMe.validate(config);
        // tslint:disable-next-line:no-unused-expression
        expect(result).to.be.false;
    });

    async function defaultConfig(): Promise<any> {
        return new Promise<any>(resolve => {
            new ArduinoDaemonImpl().getExecPath()
                .then(execPath => spawnCommand(execPath, ['config', 'dump']))
                .then(content => safeLoad(content))
                .then(config => resolve(config));
        });
    }

})
