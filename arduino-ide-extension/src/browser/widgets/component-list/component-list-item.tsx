import * as React from '@theia/core/shared/react';
import { Installable } from '../../../common/protocol/installable';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { ListItemRenderer } from './list-item-renderer';

export class ComponentListItem<
  T extends ArduinoComponent
> extends React.Component<ComponentListItem.Props<T>, ComponentListItem.State> {
  constructor(props: ComponentListItem.Props<T>) {
    super(props);
    if (props.item.installable) {
      const version = props.item.availableVersions.filter(
        (version) => version !== props.item.installedVersion
      )[0];
      this.state = {
        selectedVersion: version,
        focus: false,
        versionUpdate: false,
      };
    }
  }

  override componentDidUpdate(
    prevProps: ComponentListItem.Props<T>,
    prevState: ComponentListItem.State
  ): void {
    if (this.state.focus !== prevState.focus) {
      this.props.onFocusDidChange();
    }
  }

  override render(): React.ReactNode {
    const { item, itemRenderer } = this.props;
    return (
      <div
        onMouseEnter={() => this.setState({ focus: true })}
        onMouseLeave={() => {
          if (!this.state.versionUpdate) this.setState({ focus: false });
        }}
      >
        {itemRenderer.renderItem(
          Object.assign(this.state, { item }),
          this.install.bind(this),
          this.uninstall.bind(this),
          this.onVersionChange.bind(this)
        )}
      </div>
    );
  }

  private async install(item: T): Promise<void> {
    const toInstall = this.state.selectedVersion;
    const version = this.props.item.availableVersions.filter(
      (version) => version !== this.state.selectedVersion
    )[0];
    this.setState({
      selectedVersion: version,
      versionUpdate: false,
    });
    try {
      await this.props.install(item, toInstall);
    } catch {
      this.setState({
        selectedVersion: toInstall,
      });
    }
  }

  private async uninstall(item: T): Promise<void> {
    await this.props.uninstall(item);
  }

  private onVersionChange(version: Installable.Version): void {
    this.setState({ selectedVersion: version, versionUpdate: true });
  }
}

export namespace ComponentListItem {
  export interface Props<T extends ArduinoComponent> {
    readonly item: T;
    readonly install: (item: T, version?: Installable.Version) => Promise<void>;
    readonly uninstall: (item: T) => Promise<void>;
    readonly itemRenderer: ListItemRenderer<T>;
    readonly onFocusDidChange: () => void;
  }

  export interface State {
    selectedVersion?: Installable.Version;
    focus: boolean;
    versionUpdate: boolean;
  }
}
