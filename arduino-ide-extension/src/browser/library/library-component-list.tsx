import * as React from 'react';
import { ArduinoComponent } from '../../common/protocol/arduino-component';
import { ComponentList } from '../components/component-list/component-list';
import { LibraryComponentListItem } from './library-component-list-item';

export class LibraryComponentList extends ComponentList {

    createItem(item: ArduinoComponent): React.ReactNode {
        return <LibraryComponentListItem
            key={item.name}
            item={item}
            windowService={this.props.windowService}
            install={this.props.install}
        />
    }

}
