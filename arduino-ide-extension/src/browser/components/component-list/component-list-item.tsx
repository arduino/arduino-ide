import * as React from 'react';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';

export class ComponentListItem extends React.Component<ComponentListItem.Props> {

    protected onClick = (event: React.SyntheticEvent<HTMLAnchorElement, Event>) => {
        const { target } = event.nativeEvent;
        if (target instanceof HTMLAnchorElement) {
            this.props.windowService.openNewWindow(target.href);
            event.nativeEvent.preventDefault();
        }
    }

    protected async install(item: ArduinoComponent): Promise<void> {
        await this.props.install(item);
    }

    render(): React.ReactNode {
        const { item } = this.props;

        const style = ComponentListItem.Styles;
        const name = <span className={style.NAME_CLASS}>{item.name}</span>;
        const author = <span className={style.AUTHOR_CLASS}>{item.author}</span>;
        const installedVersion = !!item.installedVersion && <div className={style.VERSION_INFO_CLASS}>
            <span className={style.VERSION_CLASS}>Version {item.installedVersion}</span>
            <span className={style.INSTALLED_CLASS}>INSTALLED</span>
        </div>;

        const summary = <div className={style.SUMMARY_CLASS}>{item.summary}</div>;

        const moreInfo = !!item.moreInfoLink && <a href={item.moreInfoLink} onClick={this.onClick}>More info</a>;
        const install = this.props.install && item.installable && !item.installedVersion &&
            <button className={style.INSTALL_BTN_CLASS} onClick={this.install.bind(this, item)}>INSTALL</button>;

        return <div className={[style.LIST_ITEM_CLASS, style.NO_SELECT_CLASS].join(' ')}>
            <div className={style.HEADER_CLASS}>
                <span>{name} by {author}</span>
                {installedVersion}
            </div>
            <div className={style.CONTENT_CLASS}>
                {summary}
            </div>
            <div className={style.FOOTER_CLASS}>
                {moreInfo}
                {install}
            </div>
        </div>;
    }

}

export namespace ComponentListItem {

    export interface Props {
        readonly item: ArduinoComponent;
        readonly windowService: WindowService;
        readonly install: (comp: ArduinoComponent) => Promise<void>;
    }

    export namespace Styles {
        export const LIST_ITEM_CLASS = 'component-list-item';
        export const HEADER_CLASS = 'header';
        export const VERSION_INFO_CLASS = 'version-info';
        export const CONTENT_CLASS = 'content';
        export const FOOTER_CLASS = 'footer';
        export const INSTALLED_CLASS = 'installed';
        export const NO_SELECT_CLASS = 'noselect';

        export const NAME_CLASS = 'name';
        export const AUTHOR_CLASS = 'author';
        export const VERSION_CLASS = 'version';
        export const SUMMARY_CLASS = 'summary';
        export const DESCRIPTION_CLASS = 'description';
        export const INSTALL_BTN_CLASS = 'install';
    }

}
