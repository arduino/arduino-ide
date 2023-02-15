import * as React from '@theia/core/shared/react';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { CloudSketchbookTreeModel } from './cloud-sketchbook-tree-model';
import { AuthenticationClientService } from '../../auth/authentication-client-service';
import { nls } from '@theia/core/lib/common';
import { ApplicationConnectionStatusContribution } from '../../theia/core/connection-status-service';

export class CloudStatus extends React.Component<
  CloudStatus.Props,
  CloudStatus.State
> {
  protected readonly toDispose = new DisposableCollection();

  constructor(props: CloudStatus.Props) {
    super(props);
    this.state = {
      status: this.status,
      refreshing: false,
    };
  }

  override componentDidMount(): void {
    this.toDispose.push(
      this.props.connectionStatus.onOfflineStatusDidChange(() =>
        this.setState({ status: this.status })
      )
    );
  }

  override componentWillUnmount(): void {
    this.toDispose.dispose();
  }

  override render(): React.ReactNode {
    if (!this.props.authenticationService.session) {
      return null;
    }
    return (
      <div className="cloud-connection-status flex-line">
        <div className="status item flex-line">
          <div
            className={`${
              this.state.status === 'connected'
                ? 'connected-status-icon'
                : 'offline-status-icon'
            }`}
          />
          {this.state.status === 'connected'
            ? nls.localize('arduino/cloud/connected', 'Connected')
            : nls.localize('arduino/cloud/offline', 'Offline')}
        </div>
        <div className="actions item flex-line">
          {this.props.connectionStatus.offlineStatus === 'internet' ? (
            <div
              className="fa fa-arduino-cloud-offline"
              title={nls.localize('arduino/cloud/offline', 'Offline')}
            />
          ) : (
            <div
              title={nls.localize('arduino/cloud/sync', 'Sync')}
              className={`fa fa-reload ${
                (this.state.refreshing && 'rotating') || ''
              }`}
              style={{ cursor: 'pointer' }}
              onClick={this.onDidClickRefresh}
            />
          )}
        </div>
      </div>
    );
  }

  private onDidClickRefresh = () => {
    this.setState({ refreshing: true });
    Promise.all([
      this.props.model.updateRoot(),
      new Promise((resolve) => setTimeout(() => resolve(true), 1000)),
    ]).then(() => {
      this.props.model.sketchbookTree().refresh();
      this.setState({ refreshing: false });
    });
  };

  private get status(): 'connected' | 'offline' {
    return this.props.connectionStatus.offlineStatus === 'internet'
      ? 'offline'
      : 'connected';
  }
}

export namespace CloudStatus {
  export interface Props {
    readonly model: CloudSketchbookTreeModel;
    readonly authenticationService: AuthenticationClientService;
    readonly connectionStatus: ApplicationConnectionStatusContribution;
  }
  export interface State {
    status: 'connected' | 'offline';
    refreshing?: boolean;
  }
}
