import URI from '@theia/core/lib/common/uri';
import { expect } from 'chai';
import { BoardSearch, LibrarySearch, Searchable } from '../../common/protocol';

interface Expectation<S extends Searchable.Options> {
  readonly uri: string;
  readonly expected: S | undefined | string;
}

describe('searchable', () => {
  describe('parse', () => {
    describe(BoardSearch.UriParser.authority, () => {
      (
        [
          {
            uri: 'http://boardsmanager#SAMD',
            expected: { query: 'SAMD', type: 'All' },
          },
          {
            uri: 'http://boardsmanager/Arduino%40Heart#littleBits',
            expected: { query: 'littleBits', type: 'Arduino@Heart' },
          },
          {
            uri: 'http://boardsmanager/too/many/segments#invalidPath',
            expected: undefined,
          },
          {
            uri: 'http://boardsmanager/random#invalidPath',
            expected: undefined,
          },
          {
            uri: 'https://boardsmanager/#invalidScheme',
            expected: `Invalid 'scheme'. Expected 'http'. URI was: https://boardsmanager/#invalidScheme.`,
          },
          {
            uri: 'http://librarymanager/#invalidAuthority',
            expected: `Invalid 'authority'. Expected: 'boardsmanager'. URI was: http://librarymanager/#invalidAuthority.`,
          },
        ] as Expectation<BoardSearch>[]
      ).map((expectation) => toIt(expectation, BoardSearch.UriParser.parse));
    });
    describe(LibrarySearch.UriParser.authority, () => {
      (
        [
          {
            uri: 'http://librarymanager#WiFiNINA',
            expected: { query: 'WiFiNINA', type: 'All', topic: 'All' },
          },
          {
            uri: 'http://librarymanager/All/Device%20Control#Servo',
            expected: {
              query: 'Servo',
              type: 'All',
              topic: 'Device Control',
            },
          },
          {
            uri: 'http://librarymanager/All/Display#SparkFun',
            expected: {
              query: 'SparkFun',
              type: 'All',
              topic: 'Display',
            },
          },
          {
            uri: 'http://librarymanager/Updatable/Display#SparkFun',
            expected: {
              query: 'SparkFun',
              type: 'Updatable',
              topic: 'Display',
            },
          },
          {
            uri: 'http://librarymanager/All/Signal%20Input%2FOutput#debouncer',
            expected: {
              query: 'debouncer',
              type: 'All',
              topic: 'Signal Input/Output',
            },
          },
          {
            uri: 'http://librarymanager/too/many/segments#invalidPath',
            expected: undefined,
          },
          {
            uri: 'http://librarymanager/absent/invalid#invalidPath',
            expected: undefined,
          },
          {
            uri: 'https://librarymanager/#invalidScheme',
            expected: `Invalid 'scheme'. Expected 'http'. URI was: https://librarymanager/#invalidScheme.`,
          },
          {
            uri: 'http://boardsmanager/#invalidAuthority',
            expected: `Invalid 'authority'. Expected: 'librarymanager'. URI was: http://boardsmanager/#invalidAuthority.`,
          },
        ] as Expectation<LibrarySearch>[]
      ).map((expectation) => toIt(expectation, LibrarySearch.UriParser.parse));
    });
  });
});

function toIt<S extends Searchable.Options>(
  { uri, expected }: Expectation<S>,
  run: (uri: URI) => Searchable.Options | undefined
): Mocha.Test {
  return it(`should ${
    typeof expected === 'string'
      ? `fail to parse '${uri}'`
      : !expected
      ? `not parse '${uri}'`
      : `parse '${uri}' to ${JSON.stringify(expected)}`
  }`, () => {
    if (typeof expected === 'string') {
      try {
        run(new URI(uri));
        expect.fail(
          `Expected an error with message '${expected}' when parsing URI: ${uri}.`
        );
      } catch (err) {
        expect(err).to.be.instanceOf(Error);
        expect(err.message).to.be.equal(expected);
      }
    } else {
      const actual = run(new URI(uri));
      if (!expected) {
        expect(actual).to.be.undefined;
      } else {
        expect(actual).to.be.deep.equal(
          expected,
          `Was: ${JSON.stringify(actual)}`
        );
      }
    }
  });
}
