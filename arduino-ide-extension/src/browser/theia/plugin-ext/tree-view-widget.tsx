import { LabelIcon } from '@theia/core/lib/browser/label-parser';
import { OpenerService, open } from '@theia/core/lib/browser/opener-service';
import { codicon } from '@theia/core/lib/browser/widgets/widget';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { URI } from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import React from '@theia/core/shared/react';
import { URI as CodeUri } from '@theia/core/shared/vscode-uri';
import { TreeViewWidget as TheiaTreeViewWidget } from '@theia/plugin-ext/lib/main/browser/view/tree-view-widget';

// Copied back from https://github.com/eclipse-theia/theia/pull/14391
// Remove the patching when Arduino uses Eclipse Theia >1.55.0
// https://github.com/eclipse-theia/theia/blob/8d3c5a11af65448b6700bedd096f8d68f0675541/packages/core/src/browser/tree/tree-view-welcome-widget.tsx#L37-L54
// https://github.com/eclipse-theia/theia/blob/8d3c5a11af65448b6700bedd096f8d68f0675541/packages/core/src/browser/tree/tree-view-welcome-widget.tsx#L146-L298

interface ViewWelcome {
  readonly view: string;
  readonly content: string;
  readonly when?: string;
  readonly enablement?: string;
  readonly order: number;
}

export interface IItem {
  readonly welcomeInfo: ViewWelcome;
  visible: boolean;
}

export interface ILink {
  readonly label: string;
  readonly href: string;
  readonly title?: string;
}

type LinkedTextItem = string | ILink;

@injectable()
export class TreeViewWidget extends TheiaTreeViewWidget {
  @inject(OpenerService)
  private readonly openerService: OpenerService;

  private readonly toDisposeBeforeUpdateViewWelcomeNodes =
    new DisposableCollection();

  protected override updateViewWelcomeNodes(): void {
    this.viewWelcomeNodes = [];
    this.toDisposeBeforeUpdateViewWelcomeNodes.dispose();
    const items = this.visibleItems.sort((a, b) => a.order - b.order);

    const enablementKeys: Set<string>[] = [];
    // the plugin-view-registry will push the changes when there is a change in the `when` prop  which controls the visibility
    // this listener is to update the enablement of the components in the view welcome
    this.toDisposeBeforeUpdateViewWelcomeNodes.push(
      this.contextService.onDidChange((event) => {
        if (enablementKeys.some((keys) => event.affects(keys))) {
          this.updateViewWelcomeNodes();
          this.update();
        }
      })
    );
    // Note: VS Code does not support the `renderSecondaryButtons` prop in welcome content either.
    for (const item of items) {
      const { content } = item;
      const enablement = isEnablementAware(item) ? item.enablement : undefined;
      const itemEnablementKeys = enablement
        ? this.contextService.parseKeys(enablement)
        : undefined;
      if (itemEnablementKeys) {
        enablementKeys.push(itemEnablementKeys);
      }
      const lines = content.split('\n');

      for (let line of lines) {
        line = line.trim();

        if (!line) {
          continue;
        }

        const linkedTextItems = this.parseLinkedText_patch14309(line);

        if (
          linkedTextItems.length === 1 &&
          typeof linkedTextItems[0] !== 'string'
        ) {
          const node = linkedTextItems[0];
          this.viewWelcomeNodes.push(
            this.renderButtonNode_patch14309(
              node,
              this.viewWelcomeNodes.length,
              enablement
            )
          );
        } else {
          const renderNode = (item: LinkedTextItem, index: number) =>
            typeof item == 'string'
              ? this.renderTextNode_patch14309(item, index)
              : this.renderLinkNode_patch14309(item, index, enablement);

          this.viewWelcomeNodes.push(
            <p key={`p-${this.viewWelcomeNodes.length}`}>
              {...linkedTextItems.flatMap(renderNode)}
            </p>
          );
        }
      }
    }
  }

  private renderButtonNode_patch14309(
    node: ILink,
    lineKey: string | number,
    enablement: string | undefined
  ): React.ReactNode {
    return (
      <div key={`line-${lineKey}`} className="theia-WelcomeViewButtonWrapper">
        <button
          title={node.title}
          className="theia-button theia-WelcomeViewButton"
          disabled={!this.isEnabledClick_patch14309(enablement)}
          onClick={(e) => this.openLinkOrCommand_patch14309(e, node.href)}
        >
          {node.label}
        </button>
      </div>
    );
  }

  private renderTextNode_patch14309(
    node: string,
    textKey: string | number
  ): React.ReactNode {
    return (
      <span key={`text-${textKey}`}>
        {this.labelParser
          .parse(node)
          .map((segment, index) =>
            LabelIcon.is(segment) ? (
              <span key={index} className={codicon(segment.name)} />
            ) : (
              <span key={index}>{segment}</span>
            )
          )}
      </span>
    );
  }

  private renderLinkNode_patch14309(
    node: ILink,
    linkKey: string | number,
    enablement: string | undefined
  ): React.ReactNode {
    return (
      <a
        key={`link-${linkKey}`}
        className={this.getLinkClassName_patch14309(node.href, enablement)}
        title={node.title || ''}
        onClick={(e) => this.openLinkOrCommand_patch14309(e, node.href)}
      >
        {node.label}
      </a>
    );
  }

  private getLinkClassName_patch14309(
    href: string,
    enablement: string | undefined
  ): string {
    const classNames = ['theia-WelcomeViewCommandLink'];
    // Only command-backed links can be disabled. All other, https:, file: remain enabled
    if (
      href.startsWith('command:') &&
      !this.isEnabledClick_patch14309(enablement)
    ) {
      classNames.push('disabled');
    }
    return classNames.join(' ');
  }

  private isEnabledClick_patch14309(enablement: string | undefined): boolean {
    return typeof enablement === 'string'
      ? this.contextService.match(enablement)
      : true;
  }

  private openLinkOrCommand_patch14309 = (
    event: React.MouseEvent,
    value: string
  ): void => {
    event.stopPropagation();

    if (value.startsWith('command:')) {
      const command = value.replace('command:', '');
      this.commands.executeCommand(command);
    } else if (value.startsWith('file:')) {
      const uri = value.replace('file:', '');
      open(this.openerService, new URI(CodeUri.file(uri).toString()));
    } else {
      this.windowService.openNewWindow(value, { external: true });
    }
  };

  private parseLinkedText_patch14309(text: string): LinkedTextItem[] {
    const result: LinkedTextItem[] = [];

    const linkRegex =
      /\[([^\]]+)\]\(((?:https?:\/\/|command:|file:)[^\)\s]+)(?: (["'])(.+?)(\3))?\)/gi;
    let index = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text))) {
      if (match.index - index > 0) {
        result.push(text.substring(index, match.index));
      }

      const [, label, href, , title] = match;

      if (title) {
        result.push({ label, href, title });
      } else {
        result.push({ label, href });
      }

      index = match.index + match[0].length;
    }

    if (index < text.length) {
      result.push(text.substring(index));
    }

    return result;
  }
}

interface EnablementAware {
  readonly enablement: string | undefined;
}

function isEnablementAware(arg: unknown): arg is EnablementAware {
  return !!arg && typeof arg === 'object' && 'enablement' in arg;
}
