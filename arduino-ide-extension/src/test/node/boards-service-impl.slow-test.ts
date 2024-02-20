import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import temp from 'temp';
import {
  BoardSearch,
  BoardsPackage,
  BoardsService,
  Installable,
} from '../../common/protocol';
import { createBaseContainer, startDaemon } from './node-test-bindings';

describe('boards-service-impl', () => {
  let boardService: BoardsService;
  let toDispose: DisposableCollection;

  before(async function () {
    this.timeout(20_000);
    const tracked = temp.track();
    toDispose = new DisposableCollection(
      Disposable.create(() => tracked.cleanupSync())
    );
    const testDirPath = tracked.mkdirSync();
    const container = await createContainer(testDirPath);
    await start(container, toDispose);
    boardService = container.get<BoardsService>(BoardsService);
  });

  after(() => toDispose.dispose());

  describe('search', () => {
    it('should run search', async function () {
      const result = await boardService.search({});
      expect(result).is.not.empty;
    });

    it('should order the available platform release versions in descending order', async function () {
      const result = await boardService.search({});
      result.forEach((platform) =>
        platform.availableVersions.forEach(
          (currentVersion, index, versions) => {
            if (index < versions.length - 2) {
              const nextArrayElement = versions[index + 1];
              const actual = Installable.Version.COMPARATOR(
                currentVersion,
                nextArrayElement
              );
              expect(actual).to.be.greaterThan(
                0,
                `Expected '${currentVersion}' to be gt '${nextArrayElement}'. All versions: ${JSON.stringify(
                  versions
                )}`
              );
            }
          }
        )
      );
    });

    it("should boost a result when 'types' includes 'arduino', and lower the score if deprecated", async () => {
      const result = await boardService.search({});
      const arduinoIndexes: number[] = [];
      const otherIndexes: number[] = [];
      const deprecatedArduinoIndexes: number[] = [];
      const deprecatedOtherIndexes: number[] = [];
      const arduino: BoardSearch.Type = 'Arduino';
      result.forEach((platform, index) => {
        if (platform.types.includes(arduino)) {
          if (platform.deprecated) {
            deprecatedArduinoIndexes.push(index);
          } else {
            arduinoIndexes.push(index);
          }
        } else {
          if (platform.deprecated) {
            deprecatedOtherIndexes.push(index);
          } else {
            otherIndexes.push(index);
          }
        }
      });
      arduinoIndexes.forEach(
        (index) =>
          expect(otherIndexes.every((otherIndex) => otherIndex > index)).to.be
            .true
      );
      otherIndexes.forEach(
        (index) =>
          expect(
            deprecatedArduinoIndexes.every(
              (deprecatedArduinoIndex) => deprecatedArduinoIndex > index
            )
          ).to.be.true
      );
      deprecatedArduinoIndexes.forEach(
        (index) =>
          expect(
            deprecatedOtherIndexes.every(
              (deprecatedOtherIndex) => deprecatedOtherIndex > index
            )
          ).to.be.true
      );
    });

    it("should boost 'arduino' and deprecated to the end of the results", async function () {
      const query = 'OS';
      const result = await boardService.search({ query });
      expect(result.length).greaterThan(1);
      const lastIndex = result.length - 1;
      const last = result[lastIndex];
      expect(last.id).to.be.equal('arduino:mbed');
      expect(last.deprecated).to.be.true;
      const windowsIoTCoreIndex = result.findIndex(
        (platform) => platform.id === 'Microsoft:win10'
      );
      expect(windowsIoTCoreIndex).to.be.greaterThanOrEqual(0);
      expect(windowsIoTCoreIndex).to.be.lessThan(lastIndex);
      const first = result[0];
      expect(typeof first.deprecated).to.be.equal('boolean');
      expect(first.deprecated).to.be.false;
    });
  });

  it('should have the installed version set', async function () {
    const timeout = 5 * 60 * 1_000; // five minutes to install/uninstall the core
    this.timeout(timeout);

    // ensure installed
    let result = await boardService.search({ query: 'arduino:avr' });
    let avr = result.find(
      (boardsPackage) => boardsPackage.id === 'arduino:avr'
    );
    expect(avr).to.be.not.undefined;
    await boardService.install({
      item: <BoardsPackage>avr,
      skipPostInstall: true,
    });

    // when installed the version is set
    result = await boardService.search({ query: 'arduino:avr' });
    avr = result.find((boardsPackage) => boardsPackage.id === 'arduino:avr');
    expect(avr).to.be.not.undefined;
    expect(avr?.installedVersion).to.be.not.undefined;

    // uninstall the core
    await boardService.uninstall({ item: <BoardsPackage>avr });
    result = await boardService.search({ query: 'arduino:avr' });
    avr = result.find((boardsPackage) => boardsPackage.id === 'arduino:avr');
    expect(avr).to.be.not.undefined;
    expect(avr?.installedVersion).to.be.undefined;
  });
});

async function createContainer(testDirPath: string): Promise<Container> {
  const data = path.join(testDirPath, 'data');
  const user = path.join(testDirPath, 'user');
  await Promise.all([
    fs.mkdir(data, { recursive: true }),
    fs.mkdir(user, { recursive: true }),
  ]);
  return createBaseContainer({ cliConfig: { directories: { data, user } } });
}

async function start(
  container: Container,
  toDispose: DisposableCollection
): Promise<void> {
  return startDaemon(container, toDispose);
}
