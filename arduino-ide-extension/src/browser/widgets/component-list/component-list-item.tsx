import React from '@theia/core/shared/react';
import type { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { Installable } from '../../../common/protocol/installable';
import type { ListItemRenderer } from './list-item-renderer';
import { UserAbortError } from './list-widget';

export class ComponentListItem<
  T extends ArduinoComponent
> extends React.Component<ComponentListItem.Props<T>, ComponentListItem.State> {
  constructor(props: ComponentListItem.Props<T>) {
    super(props);
    this.state = {};
  }

  override render(): React.ReactNode {
    const { item, itemRenderer } = this.props;
    const selectedVersion =
      this.props.edited?.item.name === item.name
        ? this.props.edited.selectedVersion
        : this.latestVersion;
    return (
      <>
        {itemRenderer.renderItem({
          item,
          selectedVersion,
          inProgress: this.state.inProgress,
          install: (item) => this.install(item),
          uninstall: (item) => this.uninstall(item),
          onVersionChange: (version) => this.onVersionChange(version),
        })}
      </>
    );
  }

  private async install(item: T): Promise<void> {
    await this.withState('installing', () =>
      this.props.install(
        item,
        this.props.edited?.item.name === item.name
          ? this.props.edited.selectedVersion
          : Installable.latest(this.props.item.availableVersions)
      )
    );
  }

  private async uninstall(item: T): Promise<void> {
    await this.withState('uninstalling', () => this.props.uninstall(item));
  }

  private async withState(
    inProgress: 'installing' | 'uninstalling',
    task: () => Promise<unknown>
  ): Promise<void> {
    this.setState({ inProgress });
    try {
      await task();
    } catch (err) {
      if (err instanceof UserAbortError) {
        // No state update when user cancels the task
        return;
      }
      throw err;
    } finally {
      this.setState({ inProgress: undefined });
    }
  }

  private onVersionChange(version: Installable.Version): void {
    this.props.onItemEdit(this.props.item, version);
  }

  private get latestVersion(): Installable.Version | undefined {
    return Installable.latest(this.props.item.availableVersions);
  }
}

export namespace ComponentListItem {
  export interface Props<T extends ArduinoComponent> {
    readonly item: T;
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
    readonly itemRenderer: ListItemRenderer<T>;
  }

  export interface State {
    inProgress?: 'installing' | 'uninstalling' | undefined;
  }
}
