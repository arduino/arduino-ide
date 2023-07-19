import { assert, expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import {
  ArduinoBinaryName,
  BinaryName,
  ClangBinaryName,
  getExecPath,
  spawnCommand,
} from '../../node/exec-util';
import temp from 'temp';

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
      const cliPath = getExecPath('arduino-cli');
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
      readonly name: BinaryName;
      readonly flags?: string[];
      readonly assertOutput: AssertOutput;
      /**
       * The Arduino LS repository is not as shiny as the CLI or the firmware uploader.
       * It does not support `version` flag either, so non-zero exit is expected.
       */
      readonly expectNonZeroExit?: boolean;
    }

    const binaryNameToVersionMapping: Record<BinaryName, string> = {
      'arduino-cli': 'cli',
      'arduino-language-server': 'languageServer',
      'arduino-fwuploader': 'fwuploader',
      clangd: 'clangd',
      'clang-format': 'clangd',
    };

    function readVersionFromPackageJson(name: BinaryName): string {
      const raw = fs.readFileSync(
        path.join(__dirname, '..', '..', '..', 'package.json'),
        { encoding: 'utf8' }
      );
      const json = JSON.parse(raw);
      expect(json.arduino).to.be.not.undefined;
      const mappedName = binaryNameToVersionMapping[name];
      expect(mappedName).to.be.not.undefined;
      const version = json.arduino[mappedName].version;
      expect(version).to.be.not.undefined;
      return version;
    }

    function createTaskAssert(name: ArduinoBinaryName): AssertOutput {
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

    function createClangdAssert(name: ClangBinaryName): AssertOutput {
      const version = readVersionFromPackageJson(name);
      return (stdout: string) => {
        expect(stdout.includes(name)).to.be.true;
        expect(stdout.includes(`version ${version}`)).to.be.true;
      };
    }

    const suites: GetExecPathTestSuite[] = [
      {
        name: 'arduino-cli',
        flags: ['version'],
        assertOutput: createTaskAssert('arduino-cli'),
      },
      {
        name: 'arduino-fwuploader',
        flags: ['version'],
        assertOutput: createTaskAssert('arduino-fwuploader'),
      },
      {
        name: 'arduino-language-server',
        assertOutput: (stderr: string) => {
          expect(stderr.includes('Path to ArduinoCLI config file must be set.'))
            .to.be.true;
        },
        expectNonZeroExit: true,
      },
      {
        name: 'clangd',
        flags: ['--version'],
        assertOutput: createClangdAssert('clangd'),
      },
      {
        name: 'clang-format',
        flags: ['--version'],
        assertOutput: createClangdAssert('clang-format'),
      },
    ];

    // This is not a functional test but it ensures all executables provided by IDE2 are tested.
    it('should cover all provided executables', () => {
      expect(suites.length).to.be.equal(
        Object.keys(binaryNameToVersionMapping).length
      );
    });

    suites.map((suite) =>
      it(`should resolve '${suite.name}'`, async () => {
        const execPath = getExecPath(suite.name);
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
