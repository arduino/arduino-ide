// import { OpenerService } from '@theia/core/lib/browser';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { /*inject,*/ injectable } from '@theia/core/shared/inversify';
import React from '@theia/core/shared/react';
import { TreeViewWidget as TheiaTreeViewWidget } from '@theia/plugin-ext/lib/main/browser/view/tree-view-widget';

@injectable()
export class TreeViewWidget extends TheiaTreeViewWidget {
  // @inject(OpenerService)
  // private readonly openerService: OpenerService;
  private readonly toDisposeBeforeUpdateViewWelcomeNodes =
    new DisposableCollection();

  // The actual rewrite of the viewsWelcome rendering aligned to VS Code to fix https://github.com/eclipse-theia/theia/issues/14309
  // Based on https://github.com/microsoft/vscode/blob/56b535f40900080fac8202c77914c5ce49fa4aae/src/vs/workbench/browser/parts/views/viewPane.ts#L228-L299
  protected override updateViewWelcomeNodes(): void {
    this.toDisposeBeforeUpdateViewWelcomeNodes.dispose();
    const viewWelcomes = this.visibleItems.sort((a, b) => a.order - b.order);
    this.viewWelcomeNodes = [];
    const allEnablementKeys: Set<string>[] = [];
    // the plugin-view-registry will push the changes when there is a change in the when context
    // this listener is to update the view when the `enablement` of the viewWelcomes changes
    this.toDisposeBeforeUpdateViewWelcomeNodes.push(
      this.contextKeyService.onDidChange((event) => {
        if (allEnablementKeys.some((keys) => event.affects(keys))) {
          this.updateViewWelcomeNodes();
          this.update();
        }
      })
    );
    // TODO: support `renderSecondaryButtons` prop from VS Code?
    for (const viewWelcome of viewWelcomes) {
      const { content } = viewWelcome;
      const enablement = isEnablementAware(viewWelcome)
        ? viewWelcome.enablement
        : undefined;
      const enablementKeys = enablement
        ? this.contextKeyService.parseKeys(enablement)
        : undefined;
      if (enablementKeys) {
        allEnablementKeys.push(enablementKeys);
      }
      const lines = content.split('\n');

      for (let line of lines) {
        line = line.trim();

        if (!line) {
          continue;
        }

        const linkedText = parseLinkedText(line);

        if (
          linkedText.nodes.length === 1 &&
          typeof linkedText.nodes[0] !== 'string'
        ) {
          const node = linkedText.nodes[0];
          this.viewWelcomeNodes.push(
            this.renderButtonNode(
              node,
              this.viewWelcomeNodes.length,
              enablement
            )
          );
        } else {
          const paragraphNodes: React.ReactNode[] = [];
          for (const node of linkedText.nodes) {
            if (typeof node === 'string') {
              paragraphNodes.push(
                this.renderTextNode(node, this.viewWelcomeNodes.length)
              );
            } else {
              paragraphNodes.push(
                this.renderCommandLinkNode(
                  node,
                  this.viewWelcomeNodes.length,
                  enablement
                )
              );
            }
          }
          if (paragraphNodes.length) {
            this.viewWelcomeNodes.push(
              <p key={`p-${this.viewWelcomeNodes.length}`}>
                {...paragraphNodes}
              </p>
            );
          }
        }
      }
    }
  }

  protected override renderButtonNode(
    node: ILink,
    lineKey: string | number,
    enablement: string | undefined = undefined
  ): React.ReactNode {
    return (
      <div key={`line-${lineKey}`} className="theia-WelcomeViewButtonWrapper">
        <button
          title={node.title}
          className="theia-button theia-WelcomeViewButton"
          disabled={!this.isEnabled(enablement)}
          onClick={(e) => this.open(e, node)}
        >
          {node.label}
        </button>
      </div>
    );
  }

  protected override renderCommandLinkNode(
    node: ILink,
    linkKey: string | number,
    enablement: string | undefined = undefined
  ): React.ReactNode {
    return (
      <a
        key={`link-${linkKey}`}
        className={this.getLinkClassName(node.href, enablement)}
        title={node.title ?? ''}
        onClick={(e) => this.open(e, node)}
      >
        {node.label}
      </a>
    );
  }

  protected override renderTextNode(
    node: string,
    textKey: string | number
  ): React.ReactNode {
    return <span key={`text-${textKey}`}>{node}</span>;
  }

  protected override getLinkClassName(
    href: string,
    enablement: string | undefined = undefined
  ): string {
    const classNames = ['theia-WelcomeViewCommandLink'];
    // Only command-backed links can be disabled. All other, https:, file: remain enabled
    if (href.startsWith('command:') && !this.isEnabled(enablement)) {
      classNames.push('disabled');
    }
    return classNames.join(' ');
  }

  private open(event: React.MouseEvent, node: ILink): void {
    event.preventDefault();
    if (node.href.startsWith('command:')) {
      const commandId = node.href.substring('commands:'.length - 1);
      this.commands.executeCommand(commandId);
    } else if (node.href.startsWith('file:')) {
      // TODO: check what Code does
    } else if (node.href.startsWith('https:')) {
      this.windowService.openNewWindow(node.href, { external: true });
    }
  }

  /**
   * @param enablement [when context](https://code.visualstudio.com/api/references/when-clause-contexts) expression string
   */
  private isEnabled(enablement: string | undefined): boolean {
    return typeof enablement === 'string'
      ? this.contextKeyService.match(enablement)
      : true;
  }
}

interface EnablementAware {
  readonly enablement: string | undefined;
}

function isEnablementAware(arg: unknown): arg is EnablementAware {
  return !!arg && typeof arg === 'object' && 'enablement' in arg;
}

// https://github.com/microsoft/vscode/blob/56b535f40900080fac8202c77914c5ce49fa4aae/src/vs/base/common/linkedText.ts#L8-L56
export interface ILink {
  readonly label: string;
  readonly href: string;
  readonly title?: string;
}

export type LinkedTextNode = string | ILink;

export class LinkedText {
  constructor(readonly nodes: LinkedTextNode[]) {}
  toString(): string {
    return this.nodes
      .map((node) => (typeof node === 'string' ? node : node.label))
      .join('');
  }
}

const LINK_REGEX =
  /\[([^\]]+)\]\(((?:https?:\/\/|command:|file:)[^\)\s]+)(?: (["'])(.+?)(\3))?\)/gi;

export function parseLinkedText(text: string): LinkedText {
  const result: LinkedTextNode[] = [];

  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = LINK_REGEX.exec(text))) {
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

  return new LinkedText(result);
}
