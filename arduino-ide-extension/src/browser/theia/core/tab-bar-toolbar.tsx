import * as React from 'react';
import { injectable } from 'inversify';
import { LabelIcon } from '@theia/core/lib/browser/label-parser';
import { TabBarToolbar as TheiaTabBarToolbar, TabBarToolbarItem } from '@theia/core/lib/browser/shell/tab-bar-toolbar';

@injectable()
export class TabBarToolbar extends TheiaTabBarToolbar {

    /**
     * Copied over from Theia. Added an ID to the parent of the toolbar item (`--container`).
     * CSS3 does not support parent selectors but we want to style the parent of the toolbar item.
     */
    protected renderItem(item: TabBarToolbarItem): React.ReactNode {
        let innerText = '';
        const classNames = [];
        if (item.text) {
            for (const labelPart of this.labelParser.parse(item.text)) {
                if (typeof labelPart !== 'string' && LabelIcon.is(labelPart)) {
                    const className = `fa fa-${labelPart.name}${labelPart.animation ? ' fa-' + labelPart.animation : ''}`;
                    classNames.push(...className.split(' '));
                } else {
                    innerText = labelPart;
                }
            }
        }
        const command = this.commands.getCommand(item.command);
        const iconClass = (typeof item.icon === 'function' && item.icon()) || item.icon || (command && command.iconClass);
        if (iconClass) {
            classNames.push(iconClass);
        }
        const tooltip = item.tooltip || (command && command.label);
        return <div id={`${item.id}--container`} key={item.id} className={`${TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM}${command && this.commandIsEnabled(command.id) ? ' enabled' : ''}`}
            onMouseDown={this.onMouseDownEvent} onMouseUp={this.onMouseUpEvent} onMouseOut={this.onMouseUpEvent} >
            <div id={item.id} className={classNames.join(' ')} onClick={this.executeCommand} title={tooltip}>{innerText}</div>
        </div>;
    }

}
