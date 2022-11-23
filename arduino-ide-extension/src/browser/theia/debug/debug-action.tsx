import * as React from '@theia/core/shared/react';
import { DebugAction as TheiaDebugAction } from '@theia/debug/lib/browser/view/debug-action';
import {
  codiconArray,
  DISABLED_CLASS,
} from '@theia/core/lib/browser/widgets/widget';

// customized debug action to show the contributed command's label when there is no icon
export class DebugAction extends TheiaDebugAction {
  override render(): React.ReactNode {
    const { enabled, label, iconClass } = this.props;
    const classNames = ['debug-action', ...codiconArray(iconClass, true)];
    if (enabled === false) {
      classNames.push(DISABLED_CLASS);
    }
    return (
      <span
        tabIndex={0}
        className={classNames.join(' ')}
        title={label}
        onClick={this.props.run}
        ref={this.setRef}
      >
        {!iconClass ||
          (iconClass.match(/plugin-icon-\d+/) && <div>{label}</div>)}
      </span>
    );
  }
}
