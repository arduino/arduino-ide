import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { Container } from '@theia/core/shared/inversify';
import { expect } from 'chai';
import { LibrarySearch, LibraryService } from '../../common/protocol';
import { createBaseContainer, startDaemon } from './node-test-bindings';

describe('library-service-impl', () => {
  let libraryService: LibraryService;
  let toDispose: DisposableCollection;

  before(async function () {
    this.timeout(20_000);
    toDispose = new DisposableCollection();
    const container = await createContainer();
    await start(container, toDispose);
    libraryService = container.get<LibraryService>(LibraryService);
  });

  after(() => toDispose.dispose());

  describe('search', () => {
    it('should run search', async function () {
      const result = await libraryService.search({});
      expect(result).is.not.empty;
    });

    it("should boost a result when 'types' includes 'arduino'", async function () {
      const result = await libraryService.search({});
      const arduinoIndexes: number[] = [];
      const otherIndexes: number[] = [];
      // Special `"types": ["Arduino", "Retired"]` case handling: https://github.com/arduino/arduino-ide/issues/1106#issuecomment-1419392742
      const retiredIndexes: number[] = [];
      const arduino: LibrarySearch.Type = 'Arduino';
      const retired: LibrarySearch.Type = 'Retired';
      result
        .filter((library) => library.types.length === 1)
        .forEach((library, index) => {
          if (library.types.includes(arduino)) {
            if (library.types.includes(retired)) {
              retiredIndexes.push(index);
            } else {
              arduinoIndexes.push(index);
            }
          } else {
            otherIndexes.push(index);
          }
        });
      arduinoIndexes.forEach(
        (index) =>
          expect(otherIndexes.every((otherIndex) => otherIndex > index)).to.be
            .true
      );
      otherIndexes.forEach(
        (index) =>
          expect(retiredIndexes.every((retiredIndex) => retiredIndex > index))
            .to.be.true
      );
    });
  });

  it("should boost library 'SD' to the top if the query term is 'SD'", async function () {
    const query = 'SD';
    const result = await libraryService.search({ query });
    expect(result.length).greaterThan(1);
    expect(result[0].name).to.be.equal(query);
  });
});

async function createContainer(): Promise<Container> {
  return createBaseContainer();
}

async function start(
  container: Container,
  toDispose: DisposableCollection
): Promise<void> {
  return startDaemon(container, toDispose);
}
