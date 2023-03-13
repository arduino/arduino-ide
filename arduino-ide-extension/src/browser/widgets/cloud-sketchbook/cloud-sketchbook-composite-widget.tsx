import * as React from '@theia/core/shared/react';
import type { Root } from '@theia/core/shared/react-dom/client';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import { CloudStatus } from './cloud-status';
import { nls } from '@theia/core/lib/common/nls';
import { CloudSketchbookTreeWidget } from './cloud-sketchbook-tree-widget';
import { AuthenticationClientService } from '../../auth/authentication-client-service';
import { CloudSketchbookTreeModel } from './cloud-sketchbook-tree-model';
import { BaseSketchbookCompositeWidget } from '../sketchbook/sketchbook-composite-widget';
import { CreateNew } from '../sketchbook/create-new';
import { ApplicationConnectionStatusContribution } from '../../theia/core/connection-status-service';
import { AuthenticationSession } from '../../../common/protocol/authentication-service';

@injectable()
export class CloudSketchbookCompositeWidget extends BaseSketchbookCompositeWidget<CloudSketchbookTreeWidget> {
  @inject(AuthenticationClientService)
  private readonly authenticationService: AuthenticationClientService;
  @inject(CloudSketchbookTreeWidget)
  private readonly cloudSketchbookTreeWidget: CloudSketchbookTreeWidget;
  @inject(ApplicationConnectionStatusContribution)
  private readonly connectionStatus: ApplicationConnectionStatusContribution;

  private _session: AuthenticationSession | undefined;

  constructor() {
    super();
    this.id = 'cloud-sketchbook-composite-widget';
    this.title.caption = nls.localize(
      'arduino/cloud/cloudSketchbook',
      'Cloud Sketchbook'
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

  protected renderFooter(footerRoot: Root): void {
    footerRoot.render(
      <>
        {this._session && (
          <CreateNew
            label={nls.localize(
              'arduino/sketchbook/newCloudSketch',
              'New Cloud Sketch'
            )}
            onClick={this.onDidClickCreateNew}
          />
        )}
        <CloudStatus
          model={
            this.cloudSketchbookTreeWidget.model as CloudSketchbookTreeModel
          }
          authenticationService={this.authenticationService}
          connectionStatus={this.connectionStatus}
        />
      </>
    );
  }

  private onDidClickCreateNew: () => void = () => {
    this.commandService.executeCommand('arduino-new-cloud-sketch');
  };
}
