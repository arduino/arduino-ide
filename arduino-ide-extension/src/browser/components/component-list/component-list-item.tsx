import * as React from 'react';
import { Installable } from '../../../common/protocol/installable';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { ListItemRenderer } from './list-item-renderer';

export class ComponentListItem<T extends ArduinoComponent> extends React.Component<ComponentListItem.Props<T>, ComponentListItem.State> {

    constructor(props: ComponentListItem.Props<T>) {
        super(props);
        if (props.item.installable) {
            const version = props.item.availableVersions.filter(version => version !== props.item.installedVersion)[0];
            this.state = {
                selectedVersion: version
            };
        }
    }

    protected async install(item: T): Promise<void> {
        const toInstall = this.state.selectedVersion;
        const version = this.props.item.availableVersions.filter(version => version !== this.state.selectedVersion)[0];
        this.setState({
            selectedVersion: version
        });
        try {
            await this.props.install(item, toInstall);
        } catch {
            this.setState({
                selectedVersion: toInstall
            });
        }
    }

    protected async uninstall(item: T): Promise<void> {
        await this.props.uninstall(item);
    }

    protected onVersionChange(version: Installable.Version) {
        this.setState({ selectedVersion: version });
    }

    render(): React.ReactNode {
        const { item, itemRenderer } = this.props;
        return itemRenderer.renderItem(
            Object.assign(this.state, { item }),
            this.install.bind(this),
            this.uninstall.bind(this),
            this.onVersionChange.bind(this)
        );
    }

}

export namespace ComponentListItem {

    export interface Props<T extends ArduinoComponent> {
        readonly item: T;
        readonly install: (item: T, version?: Installable.Version) => Promise<void>;
        readonly uninstall: (item: T) => Promise<void>;
        readonly itemRenderer: ListItemRenderer<T>;
    }

    export interface State {
        selectedVersion?: Installable.Version;
    }

}
