import * as React from 'react';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ComponentListItem } from './component-list-item';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';

export class ComponentList extends React.Component<ComponentList.Props> {

    render(): React.ReactNode {
        return <div>
            {this.props.items.map(item => <ComponentListItem key={item.name} item={item} windowService={this.props.windowService} install={this.props.install} />)}
        </div>;
    }

}

export namespace ComponentList {

    export interface Props {
        readonly items: ArduinoComponent[];
        readonly windowService: WindowService;
        readonly install: (comp: ArduinoComponent) => Promise<void>;
    }

}
