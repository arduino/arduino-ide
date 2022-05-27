import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { TreeModel } from '@theia/core/lib/browser/tree/tree-model';
import { CloudSketchbookTreeModel } from './cloud-sketchbook-tree-model';
import { AuthenticationClientService } from '../../auth/authentication-client-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { CloudSketchbookTree } from './cloud-sketchbook-tree';
import { CloudUserCommands } from '../../auth/cloud-user-commands';
import { NodeProps } from '@theia/core/lib/browser/tree/tree-widget';
import { TreeNode } from '@theia/core/lib/browser/tree';
import { CompositeTreeNode } from '@theia/core/lib/browser';
import { shell } from 'electron';
import { SketchbookTreeWidget } from '../sketchbook/sketchbook-tree-widget';
import { nls } from '@theia/core/lib/common';

const LEARN_MORE_URL =
  'https://docs.arduino.cc/software/ide-v2/tutorials/ide-v2-cloud-sketch-sync';

@injectable()
export class CloudSketchbookTreeWidget extends SketchbookTreeWidget {
  @inject(AuthenticationClientService)
  protected readonly authenticationService: AuthenticationClientService;

  @inject(FileService)
  protected readonly fileService: FileService;

  @inject(CloudSketchbookTree)
  protected readonly cloudSketchbookTree: CloudSketchbookTree;

  @postConstruct()
  protected async init(): Promise<void> {
    await super.init();
    this.addClass('tree-container'); // Adds `height: 100%` to the tree. Otherwise you cannot see it.
  }

  protected renderTree(model: TreeModel): React.ReactNode {
    if (this.shouldShowWelcomeView()) return this.renderViewWelcome();
    if (this.shouldShowEmptyView()) return this.renderEmptyView();
    return super.renderTree(model);
  }

  protected renderEmptyView() {
    return (
      <div className="cloud-sketchbook-welcome center">
        <div className="center item">
          <div>
            <p>
              <b>
                {nls.localize(
                  'arduino/cloud/emptySketchbook',
                  'Your Sketchbook is empty'
                )}
              </b>
            </p>
            <p>
              {nls.localize(
                'arduino/cloud/visitArduinoCloud',
                'Visit Arduino Cloud to create Cloud Sketches.'
              )}
            </p>
          </div>
        </div>
        <button
          className="theia-button"
          onClick={() => shell.openExternal('https://create.arduino.cc/editor')}
        >
          {nls.localize('cloud/GoToCloud', 'GO TO CLOUD')}
        </button>
        <div className="center item"></div>
      </div>
    );
  }

  protected shouldShowWelcomeView(): boolean {
    if (!this.model || this.model instanceof CloudSketchbookTreeModel) {
      return !this.authenticationService.session;
    }
    return super.shouldShowWelcomeView();
  }

  protected shouldShowEmptyView(): boolean {
    const node = this.cloudSketchbookTree.root as TreeNode;
    return CompositeTreeNode.is(node) && node.children.length === 0;
  }

  protected createNodeClassNames(node: any, props: NodeProps): string[] {
    const classNames = super.createNodeClassNames(node, props);

    if (
      node &&
      node.hasOwnProperty('underlying') &&
      this.currentSketchUri === node.underlying.toString()
    ) {
      classNames.push('active-sketch');
    }

    return classNames;
  }

  protected renderInlineCommands(node: any): React.ReactNode {
    if (CloudSketchbookTree.CloudSketchDirNode.is(node) && node.commands) {
      return Array.from(new Set(node.commands)).map((command) =>
        this.renderInlineCommand(command.id, node, {
          username: this.authenticationService.session?.account?.label,
        })
      );
    }
    return undefined;
  }

  protected renderViewWelcome(): React.ReactNode {
    return (
      <div className="cloud-sketchbook-welcome center">
        <div className="center item">
          <div>
            <p className="sign-in-title">
              {nls.localize(
                'arduino/cloud/signInToCloud',
                'Sign in to Arduino Cloud'
              )}
            </p>
            <p className="sign-in-desc">
              {nls.localize(
                'arduino/cloud/syncEditSketches',
                'Sync and edit your Arduino Cloud Sketches'
              )}
            </p>
          </div>
        </div>
        <button
          className="theia-button sign-in-cta"
          onClick={() =>
            this.commandRegistry.executeCommand(CloudUserCommands.LOGIN.id)
          }
        >
          {nls.localize('arduino/cloud/signIn', 'SIGN IN')}
        </button>
        <div className="center item">
          <div
            className="link sign-in-learnmore"
            onClick={() =>
              this.windowService.openNewWindow(LEARN_MORE_URL, {
                external: true,
              })
            }
          >
            {nls.localize('arduino/cloud/learnMore', 'Learn more')}
          </div>
        </div>
      </div>
    );
  }

  protected handleDblClickEvent(
    node: TreeNode,
    event: React.MouseEvent<HTMLElement>
  ): void {
    event.persist();

    if (
      CloudSketchbookTree.CloudSketchTreeNode.is(node) &&
      CloudSketchbookTree.CloudSketchTreeNode.isSynced(node)
    ) {
      super.handleDblClickEvent(node, event);
    }
  }
}
