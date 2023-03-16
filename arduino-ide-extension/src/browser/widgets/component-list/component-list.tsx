import * as React from '@theia/core/shared/react';
import { Virtuoso } from '@theia/core/shared/react-virtuoso';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { Installable } from '../../../common/protocol/installable';
import { HoverService } from '../../theia/core/hover-service';
import { ComponentListItem } from './component-list-item';
import { ListItemRenderer } from './list-item-renderer';

export class ComponentList<T extends ArduinoComponent> extends React.Component<
  ComponentList.Props<T>,
  ComponentList.State
> {
  constructor(props: Readonly<ComponentList.Props<T>>) {
    super(props);
    this.state = {
      isScrolling: false,
    };
  }

  override render(): React.ReactNode {
    return (
      <Virtuoso
        data={this.props.items}
        isScrolling={(isScrolling) => {
          if (this.state.isScrolling !== isScrolling) {
            this.setState({ isScrolling });
            if (isScrolling) {
              this.props.hoverService.cancelHover();
            }
          }
        }}
        itemContent={(_: number, item: T) => (
          <ComponentListItem<T>
            key={this.props.itemLabel(item)}
            item={item}
            itemRenderer={this.props.itemRenderer}
            install={this.props.install}
            uninstall={this.props.uninstall}
            edited={this.props.edited}
            onItemEdit={this.props.onItemEdit}
            isScrolling={this.state.isScrolling}
          />
        )}
      />
    );
  }
}
export namespace ComponentList {
  export interface Props<T extends ArduinoComponent> {
    readonly items: T[];
    readonly itemLabel: (item: T) => string;
    readonly itemRenderer: ListItemRenderer<T>;
    readonly install: (item: T, version?: Installable.Version) => Promise<void>;
    readonly uninstall: (item: T) => Promise<void>;
    readonly edited?: {
      item: T;
      selectedVersion: Installable.Version;
    };
    readonly onItemEdit: (
      item: T,
      selectedVersion: Installable.Version
    ) => void;
    readonly hoverService: HoverService;
  }
  export interface State {
    isScrolling: boolean;
  }
}
