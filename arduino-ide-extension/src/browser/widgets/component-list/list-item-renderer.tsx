import {
  Anchor,
  ContextMenuRenderer,
} from '@theia/core/lib/browser/context-menu-renderer';
import { TabBarToolbar } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { codicon } from '@theia/core/lib/browser/widgets/widget';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { ApplicationError } from '@theia/core/lib/common/application-error';
import {
  CommandRegistry,
  CommandService,
} from '@theia/core/lib/common/command';
import { DisposableCollection } from '@theia/core/lib/common/disposable';
import { MarkdownStringImpl } from '@theia/core/lib/common/markdown-rendering';
import { MenuModelRegistry, MenuPath } from '@theia/core/lib/common/menu';
import { MessageService } from '@theia/core/lib/common/message-service';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { Unknown } from '../../../common/nls';
import {
  CoreService,
  ExamplesService,
  LibraryPackage,
  Sketch,
  SketchContainer,
  SketchesService,
  SketchRef,
  TopicLabel,
} from '../../../common/protocol';
import type { ArduinoComponent } from '../../../common/protocol/arduino-component';
import { Installable } from '../../../common/protocol/installable';
import { openClonedExample } from '../../contributions/examples';
import {
  ArduinoMenus,
  examplesLabel,
  showDisabledContextMenuOptions,
} from '../../menu/arduino-menus';
import {
  MenuActionTemplate,
  registerMenus,
  SubmenuTemplate,
} from '../../menu/register-menu';
import { HoverService } from '../../theia/core/hover-service';

const moreInfoLabel = nls.localize('arduino/component/moreInfo', 'More info');
const otherVersionsLabel = nls.localize(
  'arduino/component/otherVersions',
  'Other Versions'
);
const installLabel = nls.localize('arduino/component/install', 'Install');
const installLatestLabel = nls.localize(
  'arduino/component/installLatest',
  'Install Latest'
);
function installVersionLabel(selectedVersion: string) {
  return nls.localize(
    'arduino/component/installVersion',
    'Install {0}',
    selectedVersion
  );
}
const updateLabel = nls.localize('arduino/component/update', 'Update');
const removeLabel = nls.localize('arduino/component/remove', 'Remove');
const byLabel = nls.localize('arduino/component/by', 'by');
function installedLabel(installedVersion: string) {
  return nls.localize(
    'arduino/component/installed',
    '{0} installed',
    installedVersion
  );
}
function clickToOpenInBrowserLabel(href: string): string | undefined {
  return nls.localize(
    'arduino/component/clickToOpen',
    'Click to open in browser: {0}',
    href
  );
}

@injectable()
export class ArduinoComponentContextMenuRenderer {
  @inject(CommandRegistry)
  private readonly commandRegistry: CommandRegistry;
  @inject(MenuModelRegistry)
  private readonly menuRegistry: MenuModelRegistry;
  @inject(ContextMenuRenderer)
  private readonly contextMenuRenderer: ContextMenuRenderer;

  private readonly toDisposeBeforeRender = new DisposableCollection();

  async render(
    anchor: Anchor,
    ...templates: Array<MenuActionTemplate | SubmenuTemplate>
  ): Promise<void> {
    this.toDisposeBeforeRender.dispose();
    this.toDisposeBeforeRender.push(
      registerMenus({
        contextId: 'component',
        commandRegistry: this.commandRegistry,
        menuRegistry: this.menuRegistry,
        templates,
      })
    );
    const options = showDisabledContextMenuOptions({
      menuPath: ArduinoMenus.ARDUINO_COMPONENT__CONTEXT,
      anchor,
    });
    this.contextMenuRenderer.render(options);
  }
}

interface ListItemRendererParams<T extends ArduinoComponent> {
  readonly item: T;
  readonly selectedVersion: Installable.Version | undefined;
  readonly inProgress?: 'installing' | 'uninstalling' | undefined;
  readonly isScrolling: boolean;
  readonly install: (item: T) => Promise<void>;
  readonly uninstall: (item: T) => Promise<void>;
  readonly onVersionChange: (version: Installable.Version) => void;
}

interface ListItemRendererServices {
  readonly windowService: WindowService;
  readonly messagesService: MessageService;
  readonly commandService: CommandService;
  readonly coreService: CoreService;
  readonly examplesService: ExamplesService;
  readonly sketchesService: SketchesService;
  readonly contextMenuRenderer: ArduinoComponentContextMenuRenderer;
}

@injectable()
export class ListItemRenderer<T extends ArduinoComponent> {
  @inject(WindowService)
  private readonly windowService: WindowService;
  @inject(MessageService)
  private readonly messageService: MessageService;
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(HoverService)
  private readonly hoverService: HoverService;
  @inject(CoreService)
  private readonly coreService: CoreService;
  @inject(ExamplesService)
  private readonly examplesService: ExamplesService;
  @inject(SketchesService)
  private readonly sketchesService: SketchesService;
  @inject(ArduinoComponentContextMenuRenderer)
  private readonly contextMenuRenderer: ArduinoComponentContextMenuRenderer;

  private readonly onMoreInfo = (href: string | undefined): void => {
    if (href) {
      this.windowService.openNewWindow(href, { external: true });
    }
  };

  private readonly showHover = (
    event: React.MouseEvent<HTMLElement>,
    params: ListItemRendererParams<T>
  ) => {
    if (!params.isScrolling) {
      const markdown = this.markdown(params);
      this.hoverService.requestHover({
        content: new MarkdownStringImpl(markdown),
        target: event.currentTarget,
        position: 'right',
      });
    }
  };
  renderItem(params: ListItemRendererParams<T>): React.ReactNode {
    const action = this.action(params);
    return (
      <>
        <Separator />
        <div
          className="component-list-item noselect"
          onMouseOver={(event) => this.showHover(event, params)}
        >
          <Header
            params={params}
            action={action}
            services={this.services}
            onMoreInfo={this.onMoreInfo}
          />
          <Content params={params} onMoreInfo={this.onMoreInfo} />
          <Footer params={params} action={action} />
        </div>
      </>
    );
  }

  private action(params: ListItemRendererParams<T>): Installable.Action {
    const {
      item: { installedVersion, availableVersions },
      selectedVersion,
    } = params;
    return Installable.action({
      installed: installedVersion,
      available: availableVersions,
      selected: selectedVersion,
    });
  }

  private markdown(params: ListItemRendererParams<T>): string {
    // TODO: dedicated library and boards services for the markdown content generation
    const {
      item,
      item: { name, author, description, summary, installedVersion },
    } = params;
    let title = `__${name}__ ${byLabel} ${author}`;
    if (installedVersion) {
      title += `\n\n(${installedLabel(`\`${installedVersion}\``)})`;
    }
    if (LibraryPackage.is(item)) {
      let content = `\n\n${summary}`;
      // do not repeat the same info if paragraph and sentence are the same
      // example: https://github.com/arduino-libraries/ArduinoCloudThing/blob/8cbcee804e99fed614366c1b87143b1f1634c45f/library.properties#L5-L6
      if (description && description !== summary) {
        content += `\n_____\n\n${description}`;
      }
      return `${title}\n\n____${content}\n\n____\n${TopicLabel}: \`${item.category}\``;
    }
    return `${title}\n\n____\n\n${summary}\n\n - ${description
      .split(',')
      .join('\n - ')}`;
  }

  private get services(): ListItemRendererServices {
    return {
      windowService: this.windowService,
      messagesService: this.messageService,
      commandService: this.commandService,
      coreService: this.coreService,
      sketchesService: this.sketchesService,
      examplesService: this.examplesService,
      contextMenuRenderer: this.contextMenuRenderer,
    };
  }
}

class Separator extends React.Component {
  override render(): React.ReactNode {
    return (
      <div className="separator">
        <div />
        <div className="line" />
        <div />
      </div>
    );
  }
}

class Header<T extends ArduinoComponent> extends React.Component<
  Readonly<{
    params: ListItemRendererParams<T>;
    action: Installable.Action;
    services: ListItemRendererServices;
    onMoreInfo: (href: string | undefined) => void;
  }>
> {
  override render(): React.ReactNode {
    return (
      <div className="header">
        <div>
          <Title {...this.props} />
          <Toolbar {...this.props} />
        </div>
        <InstalledVersion {...this.props} />
      </div>
    );
  }
}

class Toolbar<T extends ArduinoComponent> extends React.Component<
  Readonly<{
    params: ListItemRendererParams<T>;
    action: Installable.Action;
    services: ListItemRendererServices;
    onMoreInfo: (href: string | undefined) => void;
  }>
> {
  private readonly onClick = (event: React.MouseEvent): void => {
    event.stopPropagation();
    event.preventDefault();
    const anchor = this.toAnchor(event);
    this.showContextMenu(anchor);
  };

  override render(): React.ReactNode {
    return (
      <div className={TabBarToolbar.Styles.TAB_BAR_TOOLBAR}>
        <div className={`${TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM} enabled`}>
          <div
            id="__more__"
            className={codicon('ellipsis', true)}
            title={nls.localizeByDefault('More Actions...')}
            onClick={this.onClick}
          />
        </div>
      </div>
    );
  }

  private toAnchor(event: React.MouseEvent): Anchor {
    const itemBox = event.currentTarget
      .closest('.' + TabBarToolbar.Styles.TAB_BAR_TOOLBAR_ITEM)
      ?.getBoundingClientRect();
    return itemBox
      ? {
          y: itemBox.bottom + itemBox.height / 2,
          x: itemBox.left,
        }
      : event.nativeEvent;
  }

  private async showContextMenu(anchor: Anchor): Promise<void> {
    this.props.services.contextMenuRenderer.render(
      anchor,
      this.moreInfo,
      ...(await this.examples),
      ...this.otherVersions,
      ...this.actions
    );
  }

  private get moreInfo(): MenuActionTemplate {
    const {
      params: {
        item: { moreInfoLink },
      },
    } = this.props;
    return {
      menuLabel: moreInfoLabel,
      menuPath: ArduinoMenus.ARDUINO_COMPONENT__CONTEXT,
      handler: {
        execute: () => this.props.onMoreInfo(moreInfoLink),
        isEnabled: () => Boolean(moreInfoLink),
      },
    };
  }

  private get examples(): Promise<Array<MenuActionTemplate | SubmenuTemplate>> {
    const {
      params: {
        item,
        item: { installedVersion, name },
      },
      services: { examplesService },
    } = this.props;
    // TODO: `LibraryPackage.is` should not be here but it saves one extra `lib list`
    // gRPC equivalent call with the name of a platform which will result an empty array.
    if (!LibraryPackage.is(item) || !installedVersion) {
      return Promise.resolve([]);
    }
    const submenuPath = [
      ...ArduinoMenus.ARDUINO_COMPONENT__CONTEXT,
      'examples',
    ];
    return examplesService.find({ libraryName: name }).then((containers) => [
      {
        submenuPath,
        menuLabel: examplesLabel,
        options: { order: String(0) },
      },
      ...containers
        .map((container) => this.flattenContainers(container, submenuPath))
        .reduce((acc, curr) => acc.concat(curr), []),
    ]);
  }

  private flattenContainers(
    container: SketchContainer,
    menuPath: MenuPath,
    depth = 0
  ): Array<MenuActionTemplate | SubmenuTemplate> {
    const templates: Array<MenuActionTemplate | SubmenuTemplate> = [];
    const { label } = container;
    if (depth > 0) {
      menuPath = [...menuPath, label];
      templates.push({
        submenuPath: menuPath,
        menuLabel: label,
        options: { order: label.toLocaleLowerCase() },
      });
    }
    return templates
      .concat(
        ...container.sketches.map((sketch) =>
          this.sketchToMenuTemplate(sketch, menuPath)
        )
      )
      .concat(
        container.children
          .map((childContainer) =>
            this.flattenContainers(childContainer, menuPath, ++depth)
          )
          .reduce((acc, curr) => acc.concat(curr), [])
      );
  }

  private sketchToMenuTemplate(
    sketch: SketchRef,
    menuPath: MenuPath
  ): MenuActionTemplate {
    const { name, uri } = sketch;
    const { sketchesService, commandService } = this.props.services;
    return {
      menuLabel: name,
      menuPath,
      handler: {
        execute: () =>
          openClonedExample(
            uri,
            { sketchesService, commandService },
            this.onExampleOpenError
          ),
      },
      order: name.toLocaleLowerCase(),
    };
  }

  private get onExampleOpenError(): {
    onDidFailClone: (
      err: ApplicationError<number, unknown>,
      uri: string
    ) => unknown;
    onDidFailOpen: (
      err: ApplicationError<number, unknown>,
      sketch: Sketch
    ) => unknown;
  } {
    const {
      services: { messagesService, coreService },
    } = this.props;
    const handle = async (err: ApplicationError<number, unknown>) => {
      messagesService.error(err.message);
      return coreService.refresh();
    };
    return {
      onDidFailClone: handle,
      onDidFailOpen: handle,
    };
  }

  private get otherVersions(): Array<MenuActionTemplate | SubmenuTemplate> {
    const {
      params: {
        item: { availableVersions },
        selectedVersion,
        onVersionChange,
      },
    } = this.props;
    const submenuPath = [
      ...ArduinoMenus.ARDUINO_COMPONENT__CONTEXT,
      'other-versions',
    ];
    return [
      {
        submenuPath,
        menuLabel: otherVersionsLabel,
        options: { order: String(1) },
      },
      ...availableVersions
        .filter((version) => version !== selectedVersion)
        .map((version) => ({
          menuPath: submenuPath,
          menuLabel: version,
          handler: {
            execute: () => onVersionChange(version),
          },
        })),
    ];
  }

  private get actions(): MenuActionTemplate[] {
    const {
      action,
      params: {
        item,
        item: { availableVersions, installedVersion },
        install,
        uninstall,
        selectedVersion,
      },
    } = this.props;
    const removeAction = {
      menuLabel: removeLabel,
      menuPath: ArduinoMenus.ARDUINO_COMPONENT__CONTEXT__ACTION_GROUP,
      handler: {
        execute: () => uninstall(item),
      },
    };
    const installAction = {
      menuLabel: installVersionLabel(
        selectedVersion ?? Installable.latest(availableVersions) ?? ''
      ),
      menuPath: ArduinoMenus.ARDUINO_COMPONENT__CONTEXT__ACTION_GROUP,
      handler: {
        execute: () => install(item),
      },
    };
    const installLatestAction = {
      menuLabel: installLatestLabel,
      menuPath: ArduinoMenus.ARDUINO_COMPONENT__CONTEXT__ACTION_GROUP,
      handler: {
        execute: () => install(item),
      },
    };
    const updateAction = {
      menuLabel: updateLabel,
      menuPath: ArduinoMenus.ARDUINO_COMPONENT__CONTEXT__ACTION_GROUP,
      handler: {
        execute: () => install(item),
      },
    };
    switch (action) {
      case 'unknown':
        return [];
      case 'remove': {
        return [removeAction];
      }
      case 'update': {
        return [removeAction, updateAction];
      }
      case 'installLatest':
        return [
          ...(Boolean(installedVersion) ? [removeAction] : []),
          installLatestAction,
        ];
      case 'installSelected': {
        return [
          ...(Boolean(installedVersion) ? [removeAction] : []),
          installAction,
        ];
      }
    }
  }
}

class Title<T extends ArduinoComponent> extends React.Component<
  Readonly<{
    params: ListItemRendererParams<T>;
  }>
> {
  override render(): React.ReactNode {
    const { name, author } = this.props.params.item;
    return (
      <div className="title">
        {name && author ? (
          <>
            {<span className="name">{name}</span>}{' '}
            {<span className="author">{`${byLabel} ${author}`}</span>}
          </>
        ) : name ? (
          <span className="name">{name}</span>
        ) : (
          <span className="name">{Unknown}</span>
        )}
      </div>
    );
  }
}

class InstalledVersion<T extends ArduinoComponent> extends React.Component<
  Readonly<{
    params: ListItemRendererParams<T>;
  }>
> {
  private readonly onClick = (): void => {
    this.props.params.uninstall(this.props.params.item);
  };

  override render(): React.ReactNode {
    const { installedVersion } = this.props.params.item;
    return (
      installedVersion && (
        <div className="version">
          <span
            className="installed-version"
            onClick={this.onClick}
            {...{
              version: installedLabel(installedVersion),
              remove: removeLabel,
            }}
          />
        </div>
      )
    );
  }
}

class Content<T extends ArduinoComponent> extends React.Component<
  Readonly<{
    params: ListItemRendererParams<T>;
    onMoreInfo: (href: string | undefined) => void;
  }>
> {
  override render(): React.ReactNode {
    const {
      params: {
        item: { summary, description },
      },
    } = this.props;
    const content = [summary, description].filter(Boolean).join(' ');
    return (
      <div className="content">
        <p>{content}</p>
        <MoreInfo {...this.props} />
      </div>
    );
  }
}

class MoreInfo<T extends ArduinoComponent> extends React.Component<
  Readonly<{
    params: ListItemRendererParams<T>;
    onMoreInfo: (href: string | undefined) => void;
  }>
> {
  private readonly onClick = (
    event: React.SyntheticEvent<HTMLAnchorElement, Event>
  ): void => {
    const { target } = event.nativeEvent;
    if (target instanceof HTMLAnchorElement) {
      this.props.onMoreInfo(target.href);
      event.nativeEvent.preventDefault();
    }
  };

  override render(): React.ReactNode {
    const {
      params: {
        item: { moreInfoLink: href },
      },
    } = this.props;
    return (
      href && (
        <div className="info" title={clickToOpenInBrowserLabel(href)}>
          <a href={href} onClick={this.onClick}>
            {moreInfoLabel}
          </a>
        </div>
      )
    );
  }
}

class Footer<T extends ArduinoComponent> extends React.Component<
  Readonly<{
    params: ListItemRendererParams<T>;
    action: Installable.Action;
  }>
> {
  override render(): React.ReactNode {
    const { isScrolling } = this.props.params;
    const className = ['footer'];
    if (isScrolling) {
      className.push('scrolling');
    }
    return (
      <div className={className.join(' ')}>
        <SelectVersion {...this.props} />
        <Button {...this.props} />
      </div>
    );
  }
}

class SelectVersion<T extends ArduinoComponent> extends React.Component<
  Readonly<{
    params: ListItemRendererParams<T>;
    action: Installable.Action;
  }>
> {
  private readonly onChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const version = event.target.value;
    if (version) {
      this.props.params.onVersionChange(version);
    }
  };

  override render(): React.ReactNode {
    const {
      selectedVersion,
      item: { availableVersions },
    } = this.props.params;
    switch (this.props.action) {
      case 'installLatest': // fall-through
      case 'installSelected': // fall-through
      case 'update': // fall-through
      case 'remove':
        return (
          <select
            className="theia-select"
            value={selectedVersion}
            onChange={this.onChange}
          >
            {availableVersions.map((version) => (
              <option value={version} key={version}>
                {version}
              </option>
            ))}
          </select>
        );
      case 'unknown':
        return undefined;
    }
  }
}

class Button<T extends ArduinoComponent> extends React.Component<
  Readonly<{
    params: ListItemRendererParams<T>;
    action: Installable.Action;
  }>
> {
  override render(): React.ReactNode {
    const {
      params: { item, install, uninstall, inProgress: state },
    } = this.props;
    const classNames = ['theia-button install uppercase'];
    let onClick;
    let label;
    switch (this.props.action) {
      case 'unknown':
        return undefined;
      case 'installLatest': {
        classNames.push('primary');
        label = installLabel;
        onClick = () => install(item);
        break;
      }
      case 'installSelected': {
        classNames.push('secondary');
        label = installLabel;
        onClick = () => install(item);
        break;
      }
      case 'update': {
        classNames.push('secondary');
        label = updateLabel;
        onClick = () => install(item);
        break;
      }
      case 'remove': {
        classNames.push('secondary', 'no-border');
        label = removeLabel;
        onClick = () => uninstall(item);
        break;
      }
    }
    return (
      <button
        className={classNames.join(' ')}
        onClick={onClick}
        disabled={Boolean(state)}
      >
        {label}
      </button>
    );
  }
}
