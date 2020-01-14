import * as React from 'react';
import { inject, injectable } from 'inversify';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { Installable } from '../../../common/protocol/installable';
import { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { ComponentListItem } from './component-list-item';

@injectable()
export class ListItemRenderer<T extends ArduinoComponent> {

    @inject(WindowService)
    protected windowService: WindowService;

    protected onMoreInfoClick = (event: React.SyntheticEvent<HTMLAnchorElement, Event>) => {
        const { target } = event.nativeEvent;
        if (target instanceof HTMLAnchorElement) {
            this.windowService.openNewWindow(target.href, { external: true });
            event.nativeEvent.preventDefault();
        }
    }

    renderItem(
        input: ComponentListItem.State & { item: T },
        install: (item: T) => Promise<void>,
        uninstall: (item: T) => Promise<void>,
        onVersionChange: (version: Installable.Version) => void
    ): React.ReactNode {

        const { item } = input;
        let nameAndAuthor: JSX.Element;
        if (item.name && item.author) {
            const name = <span className='name'>{item.name}</span>;
            const author = <span className='author'>{item.author}</span>;
            nameAndAuthor = <span>{name} by {author}</span>
        } else if (item.name) {
            nameAndAuthor = <span className='name'>{item.name}</span>;
        } else if ((item as any).id) {
            nameAndAuthor = <span className='name'>{(item as any).id}</span>;
        } else {
            nameAndAuthor = <span className='name'>Unknown</span>;
        }
        const onClickUninstall = () => uninstall(item);
        const installedVersion = !!item.installedVersion && <div className='version-info'>
            <span className='version'>Version {item.installedVersion}</span>
            <span className='installed' onClick={onClickUninstall} />
        </div>;

        const summary = <div className='summary'>{item.summary}</div>;
        const description = <div className='summary'>{item.description}</div>;

        const moreInfo = !!item.moreInfoLink && <a href={item.moreInfoLink} onClick={this.onMoreInfoClick}>More info</a>;
        const onClickInstall = () => install(item);
        const installButton = item.installable &&
            <button className='install' onClick={onClickInstall}>INSTALL</button>;

        const onSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
            const version = event.target.value;
            if (version) {
                onVersionChange(version);
            }
        }

        const versions = (() => {
            const { availableVersions } = item;
            if (availableVersions.length === 0) {
                return undefined;
            } else if (availableVersions.length === 1) {
                return <label>{availableVersions[0]}</label>
            } else {
                return <select
                    value={input.selectedVersion}
                    onChange={onSelectChange}>
                    {
                        item.availableVersions
                            .filter(version => version !== item.installedVersion) // Filter the version that is currently installed.
                            .map(version => <option value={version} key={version}>{version}</option>)
                    }
                </select>;
            }
        })();

        return <div className='component-list-item noselect'>
            <div className='header'>
                {nameAndAuthor}
                {installedVersion}
            </div>
            <div className='content'>
                {summary}
                {description}
            </div>
            <div className='info'>
                {moreInfo}
            </div>
            <div className='footer'>
                {installButton}
                {versions}
            </div>
        </div>;
    }

}
