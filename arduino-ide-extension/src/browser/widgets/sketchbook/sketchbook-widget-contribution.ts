import { inject, injectable } from '@theia/core/shared/inversify';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { MenuModelRegistry } from '@theia/core/lib/common/menu';
import { PreferenceService } from '@theia/core/lib/browser/preferences/preference-service';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application';
import { MainMenuManager } from '../../../common/main-menu-manager';
import { ArduinoPreferences } from '../../arduino-preferences';
import { SketchbookWidget } from './sketchbook-widget';
import { PlaceholderMenuNode } from '../../menu/arduino-menus';
import { SketchbookTree } from './sketchbook-tree';
import { SketchbookCommands } from './sketchbook-commands';
import { WorkspaceService } from '../../theia/workspace/workspace-service';
import {
  ContextMenuRenderer,
  Navigatable,
  RenderContextMenuOptions,
  SelectableTreeNode,
  Widget,
} from '@theia/core/lib/browser';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import {
  CurrentSketch,
  SketchesServiceClientImpl,
} from '../../sketches-service-client-impl';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { URI } from '../../contributions/contribution';
import {
  WorkspaceCommands,
  WorkspaceInput,
} from '@theia/workspace/lib/browser';

export const SKETCHBOOK__CONTEXT = ['arduino-sketchbook--context'];

// `Open Folder`, `Open in New Window`
export const SKETCHBOOK__CONTEXT__MAIN_GROUP = [
  ...SKETCHBOOK__CONTEXT,
  '0_main',
];

@injectable()
export class SketchbookWidgetContribution
  extends AbstractViewContribution<SketchbookWidget>
  implements FrontendApplicationContribution
{
  @inject(ArduinoPreferences)
  protected readonly arduinoPreferences: ArduinoPreferences;

  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;

  @inject(MainMenuManager)
  protected readonly mainMenuManager: MainMenuManager;

  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  @inject(MenuModelRegistry)
  protected readonly menuRegistry: MenuModelRegistry;

  @inject(SketchesServiceClientImpl)
  protected readonly sketchServiceClient: SketchesServiceClientImpl;

  @inject(ContextMenuRenderer)
  protected readonly contextMenuRenderer: ContextMenuRenderer;

  @inject(FileService)
  protected readonly fileService: FileService;

  protected readonly toDisposeBeforeNewContextMenu = new DisposableCollection();

  constructor() {
    super({
      widgetId: 'arduino-sketchbook-widget',
      widgetName: SketchbookWidget.LABEL,
      defaultWidgetOptions: {
        area: 'left',
        rank: 1,
      },
      toggleCommandId: SketchbookCommands.TOGGLE_SKETCHBOOK_WIDGET.id,
      toggleKeybinding: 'CtrlCmd+Shift+B',
    });
  }

  onStart(): void {
    this.shell.onDidChangeCurrentWidget(() =>
      this.onCurrentWidgetChangedHandler()
    );

    this.arduinoPreferences.onPreferenceChanged(({ preferenceName }) => {
      if (preferenceName === 'arduino.sketchbook.showAllFiles') {
        this.mainMenuManager.update();
      }
    });
  }

  async initializeLayout(): Promise<void> {
    return this.openView() as Promise<any>;
  }

  override registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
    registry.registerCommand(SketchbookCommands.REVEAL_SKETCH_NODE, {
      execute: (treeWidgetId: string, nodeUri: string) =>
        this.revealSketchNode(treeWidgetId, nodeUri),
    });
    registry.registerCommand(SketchbookCommands.OPEN_NEW_WINDOW, {
      execute: (arg) => this.openNewWindow(arg.node, arg?.treeWidgetId),
      isEnabled: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
      isVisible: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
    });

    registry.registerCommand(SketchbookCommands.REVEAL_IN_FINDER, {
      execute: async (arg) => {
        if (arg.node.uri) {
          const exists = await this.fileService.exists(new URI(arg.node.uri));
          if (exists) {
            const fsPath = await this.fileService.fsPath(new URI(arg.node.uri));
            if (fsPath) {
              window.electronArduino.openPath(fsPath);
            }
          }
        }
      },
      isEnabled: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
      isVisible: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
    });

    registry.registerCommand(SketchbookCommands.NEW_FOLDER, {
      execute: async (arg) => {
        if (arg.node.uri) {
          return registry.executeCommand(
            WorkspaceCommands.NEW_FOLDER.id,
            arg.node.uri
          );
        }
      },
      isEnabled: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
      isVisible: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
    });

    registry.registerCommand(SketchbookCommands.OPEN_SKETCHBOOK_CONTEXT_MENU, {
      isEnabled: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
      isVisible: (arg) =>
        !!arg && 'node' in arg && SketchbookTree.SketchDirNode.is(arg.node),
      execute: async (arg) => {
        // cleanup previous context menu entries
        this.toDisposeBeforeNewContextMenu.dispose();
        const container = arg.event.target;
        if (!container) {
          return;
        }

        // disable the "open sketch" command for the current sketch.
        // otherwise make the command clickable
        const currentSketch = await this.sketchServiceClient.currentSketch();
        if (
          CurrentSketch.isValid(currentSketch) &&
          currentSketch.uri === arg.node.uri.toString()
        ) {
          const placeholder = new PlaceholderMenuNode(
            SKETCHBOOK__CONTEXT__MAIN_GROUP,
            SketchbookCommands.OPEN_NEW_WINDOW.label!
          );
          this.menuRegistry.registerMenuNode(
            SKETCHBOOK__CONTEXT__MAIN_GROUP,
            placeholder
          );
          this.toDisposeBeforeNewContextMenu.push(
            Disposable.create(() =>
              this.menuRegistry.unregisterMenuNode(placeholder.id)
            )
          );
        } else {
          this.menuRegistry.registerMenuAction(
            SKETCHBOOK__CONTEXT__MAIN_GROUP,
            {
              commandId: SketchbookCommands.OPEN_NEW_WINDOW.id,
              label: SketchbookCommands.OPEN_NEW_WINDOW.label,
            }
          );
          this.toDisposeBeforeNewContextMenu.push(
            Disposable.create(() =>
              this.menuRegistry.unregisterMenuAction(
                SketchbookCommands.OPEN_NEW_WINDOW
              )
            )
          );
        }

        const options: RenderContextMenuOptions = {
          menuPath: SKETCHBOOK__CONTEXT,
          anchor: {
            x: container.getBoundingClientRect().left,
            y: container.getBoundingClientRect().top + container.offsetHeight,
          },
          args: [arg],
        };
        this.contextMenuRenderer.render(options);
      },
    });
  }

  override registerMenus(registry: MenuModelRegistry): void {
    super.registerMenus(registry);

    // unregister main menu action
    registry.unregisterMenuAction({
      commandId: SketchbookCommands.TOGGLE_SKETCHBOOK_WIDGET.id,
    });

    registry.registerMenuAction(SKETCHBOOK__CONTEXT__MAIN_GROUP, {
      commandId: SketchbookCommands.REVEAL_IN_FINDER.id,
      label: SketchbookCommands.REVEAL_IN_FINDER.label,
      order: '0',
    });

    registry.registerMenuAction(SKETCHBOOK__CONTEXT__MAIN_GROUP, {
      commandId: SketchbookCommands.NEW_FOLDER.id,
      label: SketchbookCommands.NEW_FOLDER.label,
      order: '1',
    });
  }

  private openNewWindow(
    node: SketchbookTree.SketchDirNode,
    treeWidgetId?: string
  ): void {
    if (!treeWidgetId) {
      const widget = this.tryGetWidget();
      if (!widget) {
        console.warn(`Could not retrieve active sketchbook tree ID.`);
        return;
      }
      treeWidgetId = widget.activeTreeWidgetId();
    }
    const widget = this.tryGetWidget();
    if (widget) {
      const nodeUri = node.uri.toString();
      const options: WorkspaceInput = {};
      Object.assign(options, {
        tasks: [
          {
            command: SketchbookCommands.REVEAL_SKETCH_NODE.id,
            args: [treeWidgetId, nodeUri],
          },
        ],
      });
      return this.workspaceService.open(node.uri, options);
    }
  }

  /**
   * Reveals and selects node in the file navigator to which given widget is related.
   * Does nothing if given widget undefined or doesn't have related resource.
   *
   * @param widget widget file resource of which should be revealed and selected
   */
  async selectWidgetFileNode(widget: Widget | undefined): Promise<void> {
    if (Navigatable.is(widget)) {
      const resourceUri = widget.getResourceUri();
      if (resourceUri) {
        const treeWidget = (await this.widget).getTreeWidget();
        const { model } = treeWidget;
        const node = await model.revealFile(resourceUri);
        if (SelectableTreeNode.is(node)) {
          model.selectNode(node);
        }
      }
    }
  }

  protected onCurrentWidgetChangedHandler(): void {
    this.selectWidgetFileNode(this.shell.currentWidget);
  }

  private async revealSketchNode(
    treeWidgetId: string,
    nodeUIri: string
  ): Promise<void> {
    return this.widget
      .then((widget) => this.shell.activateWidget(widget.id))
      .then((widget) => {
        if (widget instanceof SketchbookWidget) {
          return widget.revealSketchNode(treeWidgetId, nodeUIri);
        }
      });
  }
}
