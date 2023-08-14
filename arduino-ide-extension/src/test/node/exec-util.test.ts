import { assert, expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import { spawnCommand } from '../../node/exec-util';
import temp from 'temp';
import {
  arduinoCliPath,
  arduinoFirmwareUploaderPath,
  arduinoLanguageServerPath,
  clangdPath,
  clangFormatPath,
} from '../../node/resources';

describe('exec-utils', () => {
  describe('spawnCommand', () => {
    let tracked: typeof temp;

    before(() => {
      tracked = temp.track();
    });

    after(() => {
      if (tracked) {
        tracked.cleanupSync();
      }
    });

    it("should execute the command without 'shell:true' even if the path contains spaces but is not escaped", async () => {
      const segment = 'with some spaces';
      const cliPath = arduinoCliPath;
      const filename = path.basename(cliPath);
      const tempPath = tracked.mkdirSync();
      const tempPathWitSpaces = path.join(tempPath, segment);
      fs.mkdirSync(tempPathWitSpaces, { recursive: true });
      const cliCopyPath = path.join(tempPathWitSpaces, filename);
      fs.copyFileSync(cliPath, cliCopyPath);
      expect(fs.accessSync(cliCopyPath, fs.constants.X_OK)).to.be.undefined;
      expect(cliCopyPath.includes(segment)).to.be.true;
      const stdout = await spawnCommand(cliCopyPath, ['version']);
      expect(stdout.includes(filename)).to.be.true;
    });
  });

  describe('getExecPath', () => {
    type AssertOutput = (stdout: string) => void;

    interface GetExecPathTestSuite {
      readonly binaryName: string;
      readonly flags?: string[];
      readonly assertOutput: AssertOutput;
      /**
       * The Arduino LS repository is not as shiny as the CLI or the firmware uploader.
       * It does not support `version` flag either, so non-zero exit is expected.
       */
      readonly expectNonZeroExit?: boolean;
    }

    const binaryNameToPathMapping: Record<string, string> = {
      'arduino-cli': arduinoCliPath,
      'arduino-language-server': arduinoLanguageServerPath,
      'arduino-fwuploader': arduinoFirmwareUploaderPath,
      clangd: clangdPath,
      'clang-format': clangFormatPath,
    };

    function readVersionFromPackageJson(binaryName: string): string {
      const raw = fs.readFileSync(
        path.join(__dirname, '..', '..', '..', 'package.json'),
        { encoding: 'utf8' }
      );
      const json = JSON.parse(raw);
      expect(json.arduino).to.be.not.undefined;
      const version =
        json.arduino[binaryName === 'clang-format' ? 'clangd' : binaryName]
          .version;
      expect(version).to.be.not.undefined;
      return version;
    }

    function createTaskAssert(name: string): AssertOutput {
      const version = readVersionFromPackageJson(name);
      if (typeof version === 'string') {
        return (stdout: string) => {
          expect(stdout.includes(name)).to.be.true;
          expect(stdout.includes(version)).to.be.true;
          expect(stdout.includes('git-snapshot')).to.be.false;
        };
      }
      return (stdout: string) => {
        expect(stdout.includes(name)).to.be.true;
        expect(stdout.includes('git-snapshot')).to.be.true;
      };
    }

    function createClangdAssert(name: string): AssertOutput {
      const version = readVersionFromPackageJson(name);
      return (stdout: string) => {
        expect(stdout.includes(name)).to.be.true;
        expect(stdout.includes(`version ${version}`)).to.be.true;
      };
    }

    const suites: GetExecPathTestSuite[] = [
      {
        binaryName: 'arduino-cli',
        flags: ['version'],
        assertOutput: createTaskAssert('arduino-cli'),
      },
      {
        binaryName: 'arduino-fwuploader',
        flags: ['version'],
        assertOutput: createTaskAssert('arduino-fwuploader'),
      },
      {
        binaryName: 'arduino-language-server',
        assertOutput: (stderr: string) => {
          expect(stderr.includes('Path to ArduinoCLI config file must be set.'))
            .to.be.true;
        },
        expectNonZeroExit: true,
      },
      {
        binaryName: 'clangd',
        flags: ['--version'],
        assertOutput: createClangdAssert('clangd'),
      },
      {
        binaryName: 'clang-format',
        flags: ['--version'],
        assertOutput: createClangdAssert('clang-format'),
      },
    ];

    // This is not a functional test but it ensures all executables provided by IDE2 are tested.
    it('should cover all provided executables', () => {
      expect(suites.length).to.be.equal(
        Object.keys(binaryNameToPathMapping).length
      );
    });

    suites.map((suite) =>
      it(`should resolve '${suite.binaryName}'`, async () => {
        const execPath = binaryNameToPathMapping[suite.binaryName];
        expect(execPath).to.be.not.undefined;
        expect(execPath).to.be.not.empty;
        expect(fs.accessSync(execPath, fs.constants.X_OK)).to.be.undefined;
        if (suite.expectNonZeroExit) {
          try {
            await spawnCommand(execPath, suite.flags ?? []);
            assert.fail('Expected a non-zero exit code');
          } catch (err) {
            expect(err).to.be.an.instanceOf(Error);
            const stderr = (<Error>err).message;
            expect(stderr).to.be.not.undefined;
            expect(stderr).to.be.not.empty;
            suite.assertOutput(stderr);
          }
        } else {
          const stdout = await spawnCommand(execPath, suite.flags ?? []);
          suite.assertOutput(stdout);
        }
      })
    );
  });
});
