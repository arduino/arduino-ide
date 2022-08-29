import { injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import {
  BoardSearch,
  LibrarySearch,
  Searchable,
} from '../../../common/protocol';
import { firstToUpperCase } from '../../../common/utils';

@injectable()
export abstract class FilterRenderer<S extends Searchable.Options> {
  render(
    options: S,
    handlePropChange: (prop: keyof S, value: S[keyof S]) => void
  ): React.ReactNode {
    const props = this.props();
    return (
      <div className="filter-bar">
        {Object.entries(options)
          .filter(([prop]) => props.includes(prop as keyof S))
          .map(([prop, value]) => (
            <div key={prop}>
              {/* TODO: translations? */}
              {firstToUpperCase(prop)}:
              <select
                className="theia-select"
                value={value}
                onChange={(event) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  handlePropChange(prop as keyof S, event.target.value as any)
                }
              >
                {this.options(prop as keyof S).map((key) => (
                  <option key={key} value={key}>
                    {this.label(prop as keyof S, key)}
                  </option>
                ))}
              </select>
            </div>
          ))}
      </div>
    );
  }
  protected abstract props(): (keyof S)[];
  protected abstract options(prop: keyof S): string[];
  protected abstract label(prop: keyof S, key: string): string;
}

@injectable()
export class BoardsFilterRenderer extends FilterRenderer<BoardSearch> {
  protected props(): (keyof BoardSearch)[] {
    return ['type'];
  }
  protected options(prop: keyof BoardSearch): string[] {
    switch (prop) {
      case 'type':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return BoardSearch.TypeLiterals as any;
      default:
        throw new Error(`Unexpected prop: ${prop}`);
    }
  }
  protected label(prop: keyof BoardSearch, key: string): string {
    switch (prop) {
      case 'type':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (BoardSearch.TypeLabels as any)[key];
      default:
        throw new Error(`Unexpected key: ${prop}`);
    }
  }
}

@injectable()
export class LibraryFilterRenderer extends FilterRenderer<LibrarySearch> {
  protected props(): (keyof LibrarySearch)[] {
    return ['type', 'topic'];
  }
  protected options(prop: keyof LibrarySearch): string[] {
    switch (prop) {
      case 'type':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return LibrarySearch.TypeLiterals as any;
      case 'topic':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return LibrarySearch.TopicLiterals as any;
      default:
        throw new Error(`Unexpected prop: ${prop}`);
    }
  }
  protected label(prop: keyof LibrarySearch, key: string): string {
    switch (prop) {
      case 'type':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (LibrarySearch.TypeLabels as any)[key] as any;
      case 'topic':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (LibrarySearch.TopicLabels as any)[key] as any;
      default:
        throw new Error(`Unexpected prop: ${prop}`);
    }
  }
}
