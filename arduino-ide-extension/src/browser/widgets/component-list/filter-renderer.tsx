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
              {firstToUpperCase(prop)}:
              <select
                className="theia-select"
                value={value}
                onChange={(event) =>
                  handlePropChange(prop as keyof S, event.target.value as any)
                }
              >
                {this.options(prop as keyof S).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          ))}
      </div>
    );
  }
  protected abstract props(): (keyof S)[];
  protected abstract options(key: keyof S): string[];
}

@injectable()
export class BoardsFilterRenderer extends FilterRenderer<BoardSearch> {
  protected props(): (keyof BoardSearch)[] {
    return ['type'];
  }
  protected options(key: keyof BoardSearch): string[] {
    switch (key) {
      case 'type':
        return BoardSearch.TypeLiterals as any;
      default:
        throw new Error(`Unexpected key: ${key}`);
    }
  }
}

@injectable()
export class LibraryFilterRenderer extends FilterRenderer<LibrarySearch> {
  protected props(): (keyof LibrarySearch)[] {
    return ['type', 'topic'];
  }
  protected options(key: keyof LibrarySearch): string[] {
    switch (key) {
      case 'type':
        return LibrarySearch.TypeLiterals as any;
      case 'topic':
        return LibrarySearch.TopicLiterals as any;
      default:
        throw new Error(`Unexpected key: ${key}`);
    }
  }
}
