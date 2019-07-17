import * as React from 'react';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ComponentListItem } from './component-list-item';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';

export class ComponentList extends React.Component<ComponentList.Props> {

    protected container?: HTMLElement;

    render(): React.ReactNode {
        return <div
            className={'items-container'}
            ref={element => this.container = element || undefined}>
            {this.props.items.map(item => this.createItem(item))}
        </div>;
    }

    componentDidMount(): void {
        if (this.container && this.props.resolveContainer) {
            this.props.resolveContainer(this.container);
        }
    }

    protected createItem(item: ArduinoComponent): React.ReactNode {
        return <ComponentListItem key={item.name} item={item} windowService={this.props.windowService} install={this.props.install} />
    }

}

export namespace ComponentList {

    export interface Props {
        readonly items: ArduinoComponent[];
        readonly windowService: WindowService;
        readonly install: (comp: ArduinoComponent) => Promise<void>;
        readonly resolveContainer?: (element: HTMLElement) => void;
    }

}
