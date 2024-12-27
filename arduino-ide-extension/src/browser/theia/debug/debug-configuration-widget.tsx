import { SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { nls } from '@theia/core/lib/common/nls';
import { injectable } from '@theia/core/shared/inversify';
import React from '@theia/core/shared/react';
import { DebugAction } from '@theia/debug/lib/browser/view/debug-action';
import { DebugConfigurationSelect as TheiaDebugConfigurationSelect } from '@theia/debug/lib/browser/view/debug-configuration-select';
import { DebugConfigurationWidget as TheiaDebugConfigurationWidget } from '@theia/debug/lib/browser/view/debug-configuration-widget';

/**
 * Patched to programmatically update the debug config <select> in the widget.
 */
@injectable()
export class DebugConfigurationWidget extends TheiaDebugConfigurationWidget {
  override render(): React.ReactNode {
    return (
      <React.Fragment>
        <DebugAction
          run={this.start}
          label={nls.localizeByDefault('Start Debugging')}
          iconClass="debug-start"
          ref={this.setStepRef}
        />
        {/* The customized select component that will refresh when the config manager did change */}
        <DebugConfigurationSelect
          manager={this.manager}
          quickInputService={this.quickInputService}
          isMultiRoot={this.workspaceService.isMultiRootWorkspaceOpened}
        />
        <DebugAction
          run={this.openConfiguration}
          label={nls.localizeByDefault('Open {0}', '"launch.json"')}
          iconClass="settings-gear"
        />
        <DebugAction
          run={this.openConsole}
          label={nls.localizeByDefault('Debug Console')}
          iconClass="terminal"
        />
      </React.Fragment>
    );
  }
}

class DebugConfigurationSelect extends TheiaDebugConfigurationSelect {
  private readonly toDisposeOnUnmount = new DisposableCollection();

  override componentDidMount(): void {
    super.componentDidMount();
    this.toDisposeOnUnmount.push(
      this['manager'].onDidChange(() => this.refreshDebugConfigurations())
    );
  }

  protected override renderOptions(): SelectOption[] {
    const options = super.renderOptions();
    const addConfiguration = options[options.length - 1];
    const separator = options[options.length - 2];
    // Remove "Add configuration..." and the preceding separator options.
    // They're expected to be the last two items.
    if (
      addConfiguration.value ===
        TheiaDebugConfigurationSelect.ADD_CONFIGURATION &&
      separator.separator
    ) {
      options.splice(options.length - 2, 2);
      return options;
    }
    // Something is unexpected with the select options.
    return options;
  }

  override componentWillUnmount(): void {
    this.toDisposeOnUnmount.dispose();
  }
}
