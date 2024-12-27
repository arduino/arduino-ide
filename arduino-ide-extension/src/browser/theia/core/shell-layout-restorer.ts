import { notEmpty } from '@theia/core';
import {
  LocalStorageService,
  WidgetDescription,
} from '@theia/core/lib/browser';
import { ShellLayoutRestorer as TheiaShellLayoutRestorer } from '@theia/core/lib/browser/shell/shell-layout-restorer';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorWidgetFactory } from '@theia/editor/lib/browser/editor-widget-factory';
import { FrontendApplication } from './frontend-application';

namespace EditorPreviewWidgetFactory {
  export const ID = 'editor-preview-widget'; // The factory ID must be a hard-coded string because IDE2 does not depend on `@theia/editor-preview`.
}

@injectable()
export class ShellLayoutRestorer extends TheiaShellLayoutRestorer {
  @inject(LocalStorageService)
  private readonly localStorageService: LocalStorageService;

  override async restoreLayout(app: FrontendApplication): Promise<boolean> {
    this.logger.info('>>> Restoring the layout state...');
    let serializedLayoutData = await this.storageService.getData<string>(
      this.storageKey
    );

    // if (serializedLayoutData === undefined) {
    serializedLayoutData =
      '{"version":5,"mainPanel":{"main": null},"mainPanelPinned":[false],"bottomPanel":{"config":{"main":null},"pinned":[],"size":212,"expanded":false},"leftPanel":{"type":"sidepanel","items":[{"widget":{"constructionOptions":{"factoryId":"lingzhi-home-widget"}},"rank":1,"expanded":false,"pinned":false},{"widget":{"constructionOptions":{"factoryId":"arduino-sketchbook-widget"}},"rank":2,"expanded":true,"pinned":false},{"widget": {"constructionOptions": {"factoryId": "lingzhi-library-widget"}},"rank": 4,"expanded": false,"pinned": false},{"widget":{"constructionOptions":{"factoryId":"debug"}},"rank":5,"expanded":false,"pinned":false},{"widget":{"constructionOptions":{"factoryId":"search-view-container"}},"rank":6,"expanded":false,"pinned":false}],"size":268},"rightPanel":{"type":"sidepanel","items":[{"widget":{"constructionOptions":{"factoryId":"lingzhi-boardImg-widget"}},"rank":1,"expanded":false,"pinned":false}]}}';
    // '{"version":5,"mainPanel":{"main":{"type":"tab-area","widgets":[{"constructionOptions":{"factoryId":"code-editor-opener","options":{"counter":0,"kind":"navigatable","uri":"file:///d%3A/work/work3/arduino-ide-2.3.2/arduino-ide-extension/src/node/resources/Examples/lz-ble52/Central%28%E4%B8%BB%E6%9C%BA%E6%A8%A1%E5%BC%8F%29/central_bleuart/central_bleuart.ino"}},"innerWidgetState":"{\"cursorState\":[{\"inSelectionMode\":false,\"selectionStart\":{\"lineNumber\":1,\"column\":1},\"position\":{\"lineNumber\":1,\"column\":1}}],\"viewState\":{\"scrollLeft\":0,\"firstPosition\":{\"lineNumber\":1,\"column\":1},\"firstPositionDeltaTop\":0},\"contributionsState\":{\"editor.contrib.folding\":{\"lineCount\":194,\"provider\":\"indent\",\"foldedImports\":false},\"editor.contrib.wordHighlighter\":false}}"}],"currentIndex":0}},"mainPanelPinned":[false],"bottomPanel":{"config":{"main":null},"pinned":[],"size":212,"expanded":false},"leftPanel":{"type":"sidepanel","items":[{"widget":{"constructionOptions":{"factoryId":"lingzhi-home-widget"}},"rank":1,"expanded":false,"pinned":false},{"widget":{"constructionOptions":{"factoryId":"arduino-sketchbook-widget"}},"rank":2,"expanded":true,"pinned":false},{"widget":{"constructionOptions":{"factoryId":"debug"},"innerWidgetState":"{\"parts\":[{\"widget\":{\"constructionOptions\":{\"factoryId\":\"debug:threads\"},\"innerWidgetState\":\"{}\"},\"partId\":\"debug:threads:-1\",\"collapsed\":false,\"hidden\":false,\"relativeSize\":0.2,\"originalContainerId\":\"debug:view-container:-1\",\"originalContainerTitle\":{\"label\":\"debug\",\"iconClass\":\"codicon codicon-debug-alt\",\"closeable\":true}},{\"widget\":{\"constructionOptions\":{\"factoryId\":\"debug:frames\"},\"innerWidgetState\":\"{}\"},\"partId\":\"debug:frames:-1\",\"collapsed\":false,\"hidden\":false,\"relativeSize\":0.2,\"originalContainerId\":\"debug:view-container:-1\",\"originalContainerTitle\":{\"label\":\"debug\",\"iconClass\":\"codicon codicon-debug-alt\",\"closeable\":true}},{\"widget\":{\"constructionOptions\":{\"factoryId\":\"debug:variables\"},\"innerWidgetState\":\"{}\"},\"partId\":\"debug:variables:-1\",\"collapsed\":false,\"hidden\":false,\"relativeSize\":0.2,\"originalContainerId\":\"debug:view-container:-1\",\"originalContainerTitle\":{\"label\":\"debug\",\"iconClass\":\"codicon codicon-debug-alt\",\"closeable\":true}},{\"widget\":{\"constructionOptions\":{\"factoryId\":\"debug:watch\"},\"innerWidgetState\":\"{}\"},\"partId\":\"debug:watch:-1\",\"collapsed\":false,\"hidden\":false,\"relativeSize\":0.2,\"originalContainerId\":\"debug:view-container:-1\",\"originalContainerTitle\":{\"label\":\"debug\",\"iconClass\":\"codicon codicon-debug-alt\",\"closeable\":true}},{\"widget\":{\"constructionOptions\":{\"factoryId\":\"debug:breakpoints\"},\"innerWidgetState\":\"{}\"},\"partId\":\"debug:breakpoints:-1\",\"collapsed\":false,\"hidden\":false,\"relativeSize\":0.2,\"originalContainerId\":\"debug:view-container:-1\",\"originalContainerTitle\":{\"label\":\"debug\",\"iconClass\":\"codicon codicon-debug-alt\",\"closeable\":true}},{\"widget\":{\"constructionOptions\":{\"factoryId\":\"plugin-view\",\"options\":{\"id\":\"plugin-view:cortex-debug.peripherals\",\"viewId\":\"cortex-debug.peripherals\"}},\"innerWidgetState\":\"{\\\"label\\\":\\\"Cortex Peripherals\\\",\\\"widgets\\\":[],\\\"suppressUpdateViewVisibility\\\":false,\\\"currentViewContainerId\\\":\\\"debug\\\"}\"},\"partId\":\"plugin-view:cortex-debug.peripherals\",\"collapsed\":true,\"hidden\":true,\"originalContainerId\":\"debug:view-container:-1\",\"originalContainerTitle\":{\"label\":\"debug\",\"iconClass\":\"codicon codicon-debug-alt\",\"closeable\":true}},{\"widget\":{\"constructionOptions\":{\"factoryId\":\"plugin-view\",\"options\":{\"id\":\"plugin-view:cortex-debug.registers\",\"viewId\":\"cortex-debug.registers\"}},\"innerWidgetState\":\"{\\\"label\\\":\\\"Cortex Registers\\\",\\\"widgets\\\":[],\\\"suppressUpdateViewVisibility\\\":false,\\\"currentViewContainerId\\\":\\\"debug\\\"}\"},\"partId\":\"plugin-view:cortex-debug.registers\",\"collapsed\":true,\"hidden\":true,\"originalContainerId\":\"debug:view-container:-1\",\"originalContainerTitle\":{\"label\":\"debug\",\"iconClass\":\"codicon codicon-debug-alt\",\"closeable\":true}}],\"title\":{\"label\":\"debug\",\"iconClass\":\"codicon codicon-debug-alt\",\"closeable\":true}}"},"rank":5,"expanded":false,"pinned":false},{"widget":{"constructionOptions":{"factoryId":"search-view-container"},"innerWidgetState":"{\"parts\":[{\"partId\":\"search-in-workspace\",\"collapsed\":false,\"hidden\":false,\"originalContainerId\":\"search-view-container\",\"originalContainerTitle\":{\"label\":\"搜索\",\"iconClass\":\"codicon codicon-search\",\"closeable\":true},\"widget\":{\"constructionOptions\":{\"factoryId\":\"search-in-workspace\"},\"innerWidgetState\":\"{\\\"matchCaseState\\\":{\\\"className\\\":\\\"codicon codicon-case-sensitive\\\",\\\"enabled\\\":false,\\\"title\\\":\\\"区分大小写\\\"},\\\"wholeWordState\\\":{\\\"className\\\":\\\"codicon codicon-whole-word\\\",\\\"enabled\\\":false,\\\"title\\\":\\\"全字匹配\\\"},\\\"regExpState\\\":{\\\"className\\\":\\\"codicon codicon-regex\\\",\\\"enabled\\\":false,\\\"title\\\":\\\"使用正则表达式\\\"},\\\"includeIgnoredState\\\":{\\\"className\\\":\\\"codicon codicon-eye\\\",\\\"enabled\\\":false,\\\"title\\\":\\\"包括被忽略的文件\\\"},\\\"showSearchDetails\\\":false,\\\"searchInWorkspaceOptions\\\":{\\\"matchCase\\\":false,\\\"matchWholeWord\\\":false,\\\"useRegExp\\\":false,\\\"includeIgnored\\\":false,\\\"include\\\":[],\\\"exclude\\\":[],\\\"maxResults\\\":2000},\\\"searchTerm\\\":\\\"\\\",\\\"replaceTerm\\\":\\\"\\\",\\\"showReplaceField\\\":false,\\\"searchHistoryState\\\":{\\\"history\\\":[],\\\"index\\\":0},\\\"replaceHistoryState\\\":{\\\"history\\\":[],\\\"index\\\":0},\\\"includeHistoryState\\\":{\\\"history\\\":[],\\\"index\\\":0},\\\"excludeHistoryState\\\":{\\\"history\\\":[],\\\"index\\\":0}}\"}}],\"title\":{\"label\":\"搜索\",\"iconClass\":\"fa lingzhi-Search\",\"closeable\":true}}"},"rank":6,"expanded":false,"pinned":false}],"size":268},"rightPanel":{"type":"sidepanel","items":[{"widget":{"constructionOptions":{"factoryId":"lingzhi-boardImg-widget"}},"rank":1,"expanded":false,"pinned":false}]}}'
    //   this.logger.info('<<< Nothing to restore.');
    //   return false;
    // }

    // function isTimePast10Seconds(timeStr: string | null): boolean {
    //   if (timeStr !== null) {
    //     const currentTime = new Date();
    //     const inputTime = new Date(timeStr);
    //     const timeDifferenceInMilliseconds =
    //       currentTime.getTime() - inputTime.getTime();
    //     const thirtySecondsInMilliseconds = 10000;
    //     return timeDifferenceInMilliseconds > thirtySecondsInMilliseconds;
    //   }
    //   return false;
    // }

    // const timeStr = localStorage.getItem('lingzhi-open-sketch-view');
    // if (!timeStr || isTimePast10Seconds(timeStr)) {
    //   if (serializedLayoutData) {
    //     const layout = JSON.parse(serializedLayoutData);
    //     await layout.leftPanel.items.forEach(
    //       (item: { expanded: boolean; rank: number }) => {
    //         if (item.rank === 1) {
    //           item.expanded = true;
    //         } else {
    //           item.expanded = false;
    //         }
    //       }
    //     );
    //     serializedLayoutData = JSON.stringify(layout);
    //     await layout.leftPanel.items.forEach(
    //       (item: { expanded: boolean; rank: number }) => {
    //         if (item.rank === 2) {
    //           item.expanded = true;
    //         } else {
    //           item.expanded = false;
    //         }
    //       }
    //     );
    //     if (layout && layout.mainPanel.main) {
    //       layout.mainPanel.main = null;
    //     }
    //     localStorage.setItem('lingzhi-state-interface', JSON.stringify(layout));
    //   }
    // } else {
    //   const layout = localStorage.getItem('lingzhi-state-interface');
    //   if (layout) {
    //     serializedLayoutData = layout;
    //   }
    // }

    const isFirstStartup = !(await this.localStorageService.getData(
      'initializedLibsAndPackages'
    ));
    if (isFirstStartup) {
      const layout = JSON.parse(serializedLayoutData);
      await layout.leftPanel.items.forEach(
        (item: { expanded: boolean; rank: number }) => {
          if (item.rank === 1) {
            item.expanded = true;
          } else {
            item.expanded = false;
          }
        }
      );
      serializedLayoutData = JSON.stringify(layout);
    }
    console.log('------- SERIALIZED LAYOUT DATA -------');
    console.log(serializedLayoutData);
    console.log('------- END SERIALIZED LAYOUT DATA -------');
    const layoutData = await this.inflate(serializedLayoutData);
    await app.shell.setLayoutData(layoutData);

    this.logger.info('<<< The layout has been successfully restored.');
    return true;
  }

  /**
   * Customized to filter out duplicate editor tabs.
   */
  protected override parse<T>(
    layoutData: string,
    parseContext: TheiaShellLayoutRestorer.ParseContext
  ): T {
    return JSON.parse(layoutData, (property: string, value) => {
      if (this.isWidgetsProperty(property)) {
        const widgets = parseContext.filteredArray();
        const descs = this.filterDescriptions(value); // <--- customization to filter out editor preview construction options.
        for (let i = 0; i < descs.length; i++) {
          parseContext.push(async (context) => {
            widgets[i] = await this.convertToWidget(descs[i], context);
          });
        }
        return widgets;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const copy: any = {};
        for (const p in value) {
          if (this.isWidgetProperty(p)) {
            parseContext.push(async (context) => {
              copy[p] = await this.convertToWidget(value[p], context);
            });
          } else {
            copy[p] = value[p];
          }
        }
        return copy;
      }
      return value;
    });
  }

  /**
   * Workaround to avoid duplicate editor tabs on IDE2 startup.
   *
   * This function filters all widget construction options with `editor-preview-widget`
   * factory ID if another option has the same URI and `code-editor-opener` factory ID.
   * In other words, if a resource is about to open in the Code editor, the same resource won't open as a preview widget.
   *
   * The other bogus state that this function is fixes when there is a resource registered to open with the `editor-preview-widget`,
   * but there is no `code-editor-opener` counterpart for the same resource URI. In this case, the `editor-preview-widget` will be replaced
   * with the `code-editor-opener` and the `innerWidgetState` will be dropped.
   *
   * OK, but why is this happening? The breaking change was [here](https://github.com/eclipse-theia/theia/commit/e8e88b76673a6151d1fc12501dbe598be2358350#diff-7e1bdbcf59009518f9f3b76fe22cc8ab82d13ffa5e5e0a4262e492f25e505d98R29-R30)
   * in Theia when the editor manager of the code editor was bound to the preview editor.
   * For whatever reasons, the IDE2 started to use `@theia/editor-preview` extension from [this](https://github.com/arduino/arduino-ide/commit/fc0f67493b728f9202c9a04c7243d03b0d6ea0c7) commit. From this point, when an editor was opened,
   * but the `preview` option was not set to explicit `false` the preview editor manager has created the widgets instead of the manager of the regular code editor.
   * This code must stay to be backward compatible.
   *
   * Example of resource with multiple opener:
   * ```json
   * [
   *   {
   *     "constructionOptions": {
   *       "factoryId": "editor-preview-widget",
   *       "options": {
   *         "kind": "navigatable",
   *         "uri": "file:///Users/a.kitta/Documents/Arduino/sketch_jun3b/sketch_jun3b.ino",
   *         "counter": 1,
   *         "preview": false
   *       }
   *     },
   *     "innerWidgetState": "{\"isPreview\":false,\"editorState\":{\"cursorState\":[{\"inSelectionMode\":false,\"selectionStart\":{\"lineNumber\":10,\"column\":1},\"position\":{\"lineNumber\":10,\"column\":1}}],\"viewState\":{\"scrollLeft\":0,\"firstPosition\":{\"lineNumber\":1,\"column\":1},\"firstPositionDeltaTop\":0},\"contributionsState\":{\"editor.contrib.folding\":{\"lineCount\":10,\"provider\":\"indent\",\"foldedImports\":false},\"editor.contrib.wordHighlighter\":false}}}"
   *   },
   *   {
   *     "constructionOptions": {
   *       "factoryId": "code-editor-opener",
   *       "options": {
   *         "kind": "navigatable",
   *         "uri": "file:///Users/a.kitta/Documents/Arduino/sketch_jun3b/sketch_jun3b.ino",
   *         "counter": 0
   *       }
   *     },
   *     "innerWidgetState": "{\"cursorState\":[{\"inSelectionMode\":false,\"selectionStart\":{\"lineNumber\":1,\"column\":1},\"position\":{\"lineNumber\":1,\"column\":1}}],\"viewState\":{\"scrollLeft\":0,\"firstPosition\":{\"lineNumber\":1,\"column\":1},\"firstPositionDeltaTop\":0},\"contributionsState\":{\"editor.contrib.folding\":{\"lineCount\":10,\"provider\":\"indent\",\"foldedImports\":false},\"editor.contrib.wordHighlighter\":false}}"
   *   }
   * ]
   * ```
   *
   * Example with resource only with preview opener:
   *
   * ```json
   * [
   *   {
   *     "constructionOptions": {
   *       "factoryId": "editor-preview-widget",
   *       "options": {
   *         "kind": "navigatable",
   *         "uri": "file:///c%3A/Users/per/Documents/Arduino/duptabs/duptabs.ino",
   *         "counter": 1,
   *         "preview": false
   *       }
   *     },
   *     "innerWidgetState": "{\"isPreview\":false,\"editorState\":{\"cursorState\":[{\"inSelectionMode\":false,\"selectionStart\":{\"lineNumber\":1,\"column\":1},\"position\":{\"lineNumber\":1,\"column\":1}}],\"viewState\":{\"scrollLeft\":0,\"firstPosition\":{\"lineNumber\":1,\"column\":1},\"firstPositionDeltaTop\":0},\"contributionsState\":{\"editor.contrib.wordHighlighter\":false,\"editor.contrib.folding\":{\"lineCount\":11,\"provider\":\"indent\"}}}}"
   *   }
   * ]
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private filterDescriptions(value: any): WidgetDescription[] {
    const descriptions = value as WidgetDescription[];
    const codeEditorUris = new Set<string>();
    descriptions.forEach(({ constructionOptions }) => {
      const { options, factoryId } = constructionOptions;
      if (isResourceWidgetOptions(options)) {
        const { uri } = options;
        // resource about to open in code editor
        if (factoryId === EditorWidgetFactory.ID) {
          codeEditorUris.add(uri);
        }
      }
    });
    return descriptions
      .map((desc) => {
        const { constructionOptions } = desc;
        const { options, factoryId } = constructionOptions;
        if (factoryId === EditorPreviewWidgetFactory.ID) {
          // resource about to open in preview editor
          if (isResourceWidgetOptions(options)) {
            const { uri } = options;
            // if the resource is about to open in the code editor anyway, do not open the resource in a preview widget too.
            if (codeEditorUris.has(uri)) {
              console.log(
                `Filtered a widget construction options to avoid duplicate editor tab. URI: ${options.uri}, factory ID: ${factoryId}.`
              );
              return undefined;
            } else {
              // if the preview construction options does not have the code editor counterpart, instead of dropping the preview construction option, a code editor option will be created on the fly.
              return {
                constructionOptions: {
                  factoryId: EditorWidgetFactory.ID,
                  options: {
                    kind: 'navigatable',
                    uri,
                    counter: 0,
                  },
                },
              };
            }
          }
        }
        return desc;
      })
      .filter(notEmpty);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isResourceWidgetOptions(options: any): options is { uri: string } {
  return !!options && 'uri' in options && typeof options.uri === 'string';
}
