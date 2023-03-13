import URI from '@theia/core/lib/common/uri';
import type { ArduinoComponent } from './arduino-component';

export const Updatable = { type: 'Updatable' } as const;

export interface Searchable<T, O extends Searchable.Options> {
  search(options: O): Promise<T[]>;
}
export namespace Searchable {
  export interface Options {
    /**
     * Defaults to empty an empty string.
     */
    readonly query?: string;
  }
  export namespace UriParser {
    /**
     * Parses the `URI#fragment` into a query term.
     */
    export function parseQuery(uri: URI): { query: string } {
      return { query: uri.fragment };
    }
    /**
     * Splits the `URI#path#toString` on the `/` POSIX separator into decoded segments. The first, empty segment representing the root is omitted.
     * Examples:
     *  - `/` -> `['']`
     *  - `/All` -> `['All']`
     *  - `/All/Device%20Control` -> `['All', 'Device Control']`
     *  - `/All/Display` -> `['All', 'Display']`
     *  - `/Updatable/Signal%20Input%2FOutput` -> `['Updatable', 'Signal Input', 'Output']` (**caveat**!)
     */
    export function normalizedSegmentsOf(uri: URI): string[] {
      return uri.path.toString().split('/').slice(1).map(decodeURIComponent);
    }
  }
}

// IDE2 must keep the library search order from the CLI but do additional boosting
// https://github.com/arduino/arduino-ide/issues/1106
// This additional search result boosting considers the following groups: 'Arduino', '', 'Arduino-Retired', and 'Retired'.
// If two libraries fall into the same group, the original index is the tiebreaker.
export type SortGroup = 'Arduino' | '' | 'Arduino-Retired' | 'Retired';
const sortGroupOrder: Record<SortGroup, number> = {
  Arduino: 0,
  '': 1,
  'Arduino-Retired': 2,
  Retired: 3,
};

export function sortComponents<T extends ArduinoComponent>(
  components: T[],
  group: (component: T) => SortGroup
): T[] {
  return components
    .map((component, index) => ({ ...component, index }))
    .sort((left, right) => {
      const leftGroup = group(left);
      const rightGroup = group(right);
      if (leftGroup === rightGroup) {
        return left.index - right.index;
      }
      return sortGroupOrder[leftGroup] - sortGroupOrder[rightGroup];
    });
}
