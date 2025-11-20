import {
  injectable,
  inject,
} from '@theia/core/shared/inversify';
import {
  AbstractViewContribution,
  FrontendApplicationContribution,
} from '@theia/core/lib/browser';
import { CommandRegistry, Command } from '@theia/core/lib/common/command';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { ChatWidget, chatWidgetLabel } from './chat-widget';

export namespace ChatCommands {
  export const TOGGLE: Command = {
    id: ChatWidget.ID + ':toggle',
    label: chatWidgetLabel,
    category: 'View',
  };
}

@injectable()
export class ChatViewContribution extends AbstractViewContribution<ChatWidget> 
  implements FrontendApplicationContribution {
  static readonly TOGGLE_CHAT = ChatCommands.TOGGLE.id;

  @inject(FrontendApplicationStateService)
  protected readonly appStateService: FrontendApplicationStateService;

  constructor() {
    super({
      widgetId: ChatWidget.ID,
      widgetName: chatWidgetLabel,
      defaultWidgetOptions: {
        area: 'left',
        rank: 10, // Position in sidebar (higher = lower in list)
      },
      toggleCommandId: ChatViewContribution.TOGGLE_CHAT,
      toggleKeybinding: 'CtrlCmd+Shift+C',
    });
  }

  /**
   * Ensure the chat widget is created early so the sidebar icon appears immediately.
   * This is called when the application starts, before initializeLayout.
   */
  onStart(): void {
    // Wait for the app to be ready, then create the widget so the sidebar icon appears.
    // This ensures the icon is visible even in new windows before the widget is first opened.
    this.appStateService.reachedState('ready').then(() => {
      // Create the widget immediately so the sidebar icon appears right away.
      // We use openView with reveal:false to create the widget without showing it yet.
      this.openView({ activate: false, reveal: false }).catch(() => {
        // Ignore errors - widget will be created in initializeLayout if needed
      });
    });
  }

  /**
   * Initialize the chat widget on startup to make the sidebar icon permanently visible.
   * This ensures the icon appears in the sidebar even before the user first opens the chat.
   * Each window will have its own chat widget instance (Theia creates separate application
   * instances for each Electron window). This method is called for each new window.
   */
  async initializeLayout(): Promise<void> {
    // Open and reveal the chat widget to ensure it's always visible on startup.
    // The widget is set to non-closable, so it will always remain visible.
    await this.openView({ activate: true, reveal: true });
  }

  /**
   * Register commands explicitly to ensure they appear in the keyboard shortcuts list.
   */
  override registerCommands(registry: CommandRegistry): void {
    super.registerCommands(registry);
    // Explicitly register the toggle command to ensure it appears in shortcuts
    // Since the chat widget is non-closable, toggle just opens/reveals it
    registry.registerCommand(ChatCommands.TOGGLE, {
      execute: () => this.openView({ activate: true, reveal: true }),
      isEnabled: () => true,
      isVisible: () => true,
    });
  }

  // Note: Keybinding is automatically registered by AbstractViewContribution
  // via the toggleKeybinding parameter in the constructor, so no need to
  // override registerKeybindings here.
}

