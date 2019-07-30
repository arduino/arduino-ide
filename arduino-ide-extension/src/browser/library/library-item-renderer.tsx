import * as React from 'react';
import { injectable } from 'inversify';
import { Library } from '../../common/protocol/library-service';
import { ListItemRenderer } from '../components/component-list/list-item-renderer';

@injectable()
export class LibraryItemRenderer extends ListItemRenderer<Library> {

    renderItem(item: Library, install: (item: Library) => Promise<void>): React.ReactNode {
        const name = <span className='name'>{item.name}</span>;
        const author = <span className='author'>by {item.author}</span>;
        const installedVersion = !!item.installedVersion && <div className='version-info'>
            <span className='version'>Version {item.installedVersion}</span>
            <span className='installed'>INSTALLED</span>
        </div>;

        const summary = <div className='summary'>{item.summary}</div>;

        const moreInfo = !!item.moreInfoLink && <a href={item.moreInfoLink} onClick={this.onClick}>More info</a>;
        const installButton = item.installable && !item.installedVersion &&
            <button className='install' onClick={install.bind(this, item)}>INSTALL</button>;

        const versions = (() => {
            const { availableVersions } = item;
            if (!!item.installedVersion || availableVersions.length === 0) {
                return undefined;
            } else if (availableVersions.length === 1) {
                return <label>{availableVersions[0]}</label>
            } else {
                return <select>{item.availableVersions.map(version => <option value={version} key={version}>{version}</option>)}</select>;
            }
        })();

        return <div className='component-list-item noselect'>
            <div className='header'>
                <span>{name} {author}</span>
                {installedVersion}
            </div>
            <div className='content'>
                {summary}
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
