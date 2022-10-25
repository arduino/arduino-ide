import * as React from '@theia/core/shared/react';
import * as ReactDOM from '@theia/core/shared/react-dom';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { UserStatus } from './cloud-user-status';
import { nls } from '@theia/core/lib/common/nls';
import { CloudSketchbookTreeWidget } from './cloud-sketchbook-tree-widget';
import { AuthenticationClientService } from '../../auth/authentication-client-service';
import { CloudSketchbookTreeModel } from './cloud-sketchbook-tree-model';
import { BaseSketchbookCompositeWidget } from '../sketchbook/sketchbook-composite-widget';
import { CreateNew } from '../sketchbook/create-new';
import { AuthenticationSession } from '../../../node/auth/types';

@injectable()
export class CloudSketchbookCompositeWidget extends BaseSketchbookCompositeWidget<CloudSketchbookTreeWidget> {
  @inject(AuthenticationClientService)
  private readonly authenticationService: AuthenticationClientService;
  @inject(CloudSketchbookTreeWidget)
  private readonly cloudSketchbookTreeWidget: CloudSketchbookTreeWidget;
  private _session: AuthenticationSession | undefined;

  constructor() {
    super();
    this.id = 'cloud-sketchbook-composite-widget';
    this.title.caption = nls.localize(
      'arduino/cloud/remoteSketchbook',
      'Remote Sketchbook'
    );
    this.title.iconClass = 'cloud-sketchbook-tree-icon';
  }

  @postConstruct()
  protected init(): void {
    this.toDispose.push(
      this.authenticationService.onSessionDidChange((session) => {
        const oldSession = this._session;
        this._session = session;
        if (!!oldSession !== !!this._session) {
          this.updateFooter();
        }
      })
    );
  }

  get treeWidget(): CloudSketchbookTreeWidget {
    return this.cloudSketchbookTreeWidget;
  }

  protected renderFooter(footerNode: HTMLElement): void {
    ReactDOM.render(
      <>
        {this._session && (
          <CreateNew
            label={nls.localize(
              'arduino/sketchbook/newRemoteSketch',
              'New Remote Sketch'
            )}
            onClick={this.onDidClickCreateNew}
          />
        )}
        <UserStatus
          model={
            this.cloudSketchbookTreeWidget.model as CloudSketchbookTreeModel
          }
          authenticationService={this.authenticationService}
        />
      </>,
      footerNode
    );
  }

  private onDidClickCreateNew: () => void = () => {
    this.commandService.executeCommand('arduino-new-cloud-sketch');
  };
}
