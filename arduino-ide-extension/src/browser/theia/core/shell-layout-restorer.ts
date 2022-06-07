import { notEmpty } from '@theia/core';
import { WidgetDescription } from '@theia/core/lib/browser';
import { ShellLayoutRestorer as TheiaShellLayoutRestorer } from '@theia/core/lib/browser/shell/shell-layout-restorer';
import { injectable } from '@theia/core/shared/inversify';
import { EditorPreviewWidgetFactory } from '@theia/editor-preview/lib/browser/editor-preview-widget-factory';
import { EditorWidgetFactory } from '@theia/editor/lib/browser/editor-widget-factory';

@injectable()
export class ShellLayoutRestorer extends TheiaShellLayoutRestorer {
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
                    uri,
                    kind: 'navigatable',
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
