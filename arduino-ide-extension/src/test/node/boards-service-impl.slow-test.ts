import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { BoardSearch, BoardsService } from '../../common/protocol';
import {
  configureBackendApplicationConfigProvider,
  createBaseContainer,
  startDaemon,
} from './test-bindings';

describe('boards-service-impl', () => {
  let boardService: BoardsService;
  let toDispose: DisposableCollection;

  before(async function () {
    configureBackendApplicationConfigProvider();
    this.timeout(20_000);
    toDispose = new DisposableCollection();
    const container = createContainer();
    await start(container, toDispose);
    boardService = container.get<BoardsService>(BoardsService);
  });

  after(() => toDispose.dispose());

  describe('search', () => {
    it('should run search', async function () {
      const result = await boardService.search({});
      expect(result).is.not.empty;
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
});

function createContainer(): Container {
  return createBaseContainer();
}

async function start(
  container: Container,
  toDispose: DisposableCollection
): Promise<void> {
  return startDaemon(container, toDispose);
}
