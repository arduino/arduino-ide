import * as React from 'react';
import { injectable } from 'inversify';
import { ListItemRenderer } from '../components/component-list/list-item-renderer';
import { BoardPackage } from '../../common/protocol/boards-service';
import { Installable } from '../../common/protocol/installable';
import { ComponentListItem } from '../components/component-list/component-list-item';

@injectable()
export class BoardItemRenderer extends ListItemRenderer<BoardPackage> {

    renderItem(
        input: ComponentListItem.State & { item: BoardPackage },
        install: (item: BoardPackage) => Promise<void>,
        onVersionChange: (version: Installable.Version) => void): React.ReactNode {

        const { item } = input;
        const name = <span className='name'>{item.name}</span>;
        const author = <span className='author'>{item.author}</span>;
        const installedVersion = !!item.installedVersion && <div className='version-info'>
            <span className='version'>Version {item.installedVersion}</span>
            <span className='installed'>INSTALLED</span>
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
                <span>{name} by {author}</span>
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
