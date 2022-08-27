import * as React from '@theia/core/shared/react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import {
  CellMeasurer,
  CellMeasurerCache,
} from 'react-virtualized/dist/commonjs/CellMeasurer';
import type {
  ListRowProps,
  ListRowRenderer,
} from 'react-virtualized/dist/commonjs/List';
import List from 'react-virtualized/dist/commonjs/List';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { Installable } from '../../../common/protocol/installable';
import { ComponentListItem } from './component-list-item';
import { ListItemRenderer } from './list-item-renderer';

export class ComponentList<T extends ArduinoComponent> extends React.Component<
  ComponentList.Props<T>,
  ComponentList.State
> {
  private readonly cache: CellMeasurerCache;
  private resizeAllFlag: boolean;
  private list: List | undefined;
  private mostRecentWidth: number | undefined;

  constructor(props: ComponentList.Props<T>) {
    super(props);
    this.state = { focusIndex: 'none' };
    this.cache = new CellMeasurerCache({
      defaultHeight: 200,
      fixedWidth: true,
    });
  }

  override render(): React.ReactNode {
    return (
      <AutoSizer>
        {({ width, height }) => {
          if (this.mostRecentWidth && this.mostRecentWidth !== width) {
            this.resizeAllFlag = true;
            setTimeout(this.clearAll, 0);
          }
          this.mostRecentWidth = width;
          return (
            <List
              className={'items-container'}
              rowRenderer={this.createItem}
              overscanRowCount={100}
              height={height}
              width={width}
              rowCount={this.props.items.length}
              rowHeight={this.cache.rowHeight}
              deferredMeasurementCache={this.cache}
              ref={this.setListRef}
            />
          );
        }}
      </AutoSizer>
    );
  }

  override componentDidUpdate(
    prevProps: ComponentList.Props<T>,
    prevState: ComponentList.State
  ): void {
    if (this.resizeAllFlag || this.props.items !== prevProps.items) {
      this.clearAll(true);
    } else if (this.state.focusIndex !== prevState.focusIndex) {
      if (typeof this.state.focusIndex === 'number') {
        this.clear(this.state.focusIndex);
      }
      if (typeof prevState.focusIndex === 'number') {
        this.clear(prevState.focusIndex);
      }
    }
  }

  private setListRef = (ref: List | null): void => {
    this.list = ref || undefined;
  };

  private clearAll(scrollToTop = false): void {
    this.resizeAllFlag = false;
    this.cache.clearAll();
    if (this.list) {
      this.list.recomputeRowHeights();
      if (scrollToTop) {
        this.list.scrollToPosition(0);
      }
    }
  }

  private clear(index: number): void {
    this.cache.clear(index, 0);
    if (this.list) {
      this.list.recomputeRowHeights(index);
    }
  }

  private createItem: ListRowRenderer = ({
    index,
    parent,
    key,
    style,
  }: ListRowProps): React.ReactNode => {
    const item = this.props.items[index];
    return (
      <CellMeasurer
        cache={this.cache}
        columnIndex={0}
        key={key}
        rowIndex={index}
        parent={parent}
      >
        <div
          style={style}
          onMouseEnter={() => this.setState({ focusIndex: index })}
          onMouseLeave={() => this.setState({ focusIndex: 'none' })}
        >
          <ComponentListItem<T>
            key={this.props.itemLabel(item)}
            item={item}
            itemRenderer={this.props.itemRenderer}
            install={this.props.install}
            uninstall={this.props.uninstall}
          />
        </div>
      </CellMeasurer>
    );
  };
}

export namespace ComponentList {
  export interface Props<T extends ArduinoComponent> {
    readonly items: T[];
    readonly itemLabel: (item: T) => string;
    readonly itemDeprecated: (item: T) => boolean;
    readonly itemRenderer: ListItemRenderer<T>;
    readonly install: (item: T, version?: Installable.Version) => Promise<void>;
    readonly uninstall: (item: T) => Promise<void>;
  }
  export interface State {
    focusIndex: number | 'none';
  }
}
