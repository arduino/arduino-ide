import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { inject, injectable } from 'inversify';
import { Widget } from '@phosphor/widgets';
import { Message, MessageLoop } from '@phosphor/messaging';
import { Disposable } from '@theia/core/lib/common/disposable';
import { BaseWidget } from '@theia/core/lib/browser/widgets/widget';
import { UserStatus } from './cloud-user-status';
import { CloudSketchbookTreeWidget } from './cloud-sketchbook-tree-widget';
import { AuthenticationClientService } from '../../auth/authentication-client-service';
import { CloudSketchbookTreeModel } from './cloud-sketchbook-tree-model';

@injectable()
export class CloudSketchbookCompositeWidget extends BaseWidget {
  @inject(AuthenticationClientService)
  protected readonly authenticationService: AuthenticationClientService;

  @inject(CloudSketchbookTreeWidget)
  protected readonly cloudSketchbookTreeWidget: CloudSketchbookTreeWidget;

  private compositeNode: HTMLElement;
  private cloudUserStatusNode: HTMLElement;

  constructor() {
    super();
    this.compositeNode = document.createElement('div');
    this.compositeNode.classList.add('composite-node');
    this.cloudUserStatusNode = document.createElement('div');
    this.cloudUserStatusNode.classList.add('cloud-status-node');
    this.compositeNode.appendChild(this.cloudUserStatusNode);
    this.node.appendChild(this.compositeNode);
    this.title.caption = 'Cloud Sketchbook';
    this.title.iconClass = 'cloud-sketchbook-tree-icon';
    this.title.closable = false;
    this.id = 'cloud-sketchbook-composite-widget';
  }

  public getTreeWidget(): CloudSketchbookTreeWidget {
    return this.cloudSketchbookTreeWidget;
  }

  protected onAfterAttach(message: Message): void {
    super.onAfterAttach(message);
    Widget.attach(this.cloudSketchbookTreeWidget, this.compositeNode);
    ReactDOM.render(
      <UserStatus
        model={this.cloudSketchbookTreeWidget.model as CloudSketchbookTreeModel}
        authenticationService={this.authenticationService}
      />,
      this.cloudUserStatusNode
    );
    this.toDisposeOnDetach.push(
      Disposable.create(() => Widget.detach(this.cloudSketchbookTreeWidget))
    );
  }

  protected onResize(message: Widget.ResizeMessage): void {
    super.onResize(message);
    MessageLoop.sendMessage(
      this.cloudSketchbookTreeWidget,
      Widget.ResizeMessage.UnknownSize
    );
  }
}
