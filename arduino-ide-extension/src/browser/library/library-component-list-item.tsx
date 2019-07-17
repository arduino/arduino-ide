import * as React from 'react';
import { ComponentListItem } from '../components/component-list/component-list-item';

export class LibraryComponentListItem extends ComponentListItem {

    render(): React.ReactNode {
        const { item } = this.props;

        const name = <span className={'name'}>{item.name}</span>;
        const author = <span className={'author'}>by {item.author}</span>;
        const installedVersion = !!item.installedVersion && <div className={'version-info'}>
            <span className={'version'}>Version {item.installedVersion}</span>
            <span className={'installed'}>INSTALLED</span>
        </div>;

        const summary = <div className={'summary'}>{item.summary}</div>;

        const moreInfo = !!item.moreInfoLink && <a href={item.moreInfoLink} onClick={this.onClick}>More info</a>;
        const install = this.props.install && item.installable && !item.installedVersion &&
            <button className={'install'} onClick={this.install.bind(this, item)}>INSTALL</button>;
        const versions = (() => {
            const { availableVersions } = item;
            if (availableVersions.length === 0) {
                return undefined;
            } else if (availableVersions.length === 1) {
                return <label>{availableVersions[0]}</label>
            } else {
                return <select>{item.availableVersions.map(version => <option value={version} key={version}>{version}</option>)}</select>;
            }
        })();

        return <div className={'component-list-item noselect'}>
            <div className={'header'}>
                <span>{name} {author}</span>
                {installedVersion}
            </div>
            <div className={'content'}>
                {summary}
            </div>
            <div className={'info'}>
                {moreInfo}
            </div>
            <div className={'footer'}>
                {install}
                {versions}
            </div>
        </div>;
    }

}
