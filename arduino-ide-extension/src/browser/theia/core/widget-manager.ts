import type { MaybePromise } from '@theia/core';
import type { Widget } from '@theia/core/lib/browser';
import { WidgetManager as TheiaWidgetManager } from '@theia/core/lib/browser/widget-manager';
import { injectable } from '@theia/core/shared/inversify';
import deepEqual = require('deep-equal');

@injectable()
export class WidgetManager extends TheiaWidgetManager {
  /**
   * Customized to find any existing widget based on `options` deepEquals instead of string equals.
   * See https://github.com/eclipse-theia/theia/issues/11309.
   */
  protected override doGetWidget<T extends Widget>(
    key: string
  ): MaybePromise<T> | undefined {
    const pendingWidget = this.findExistingWidget<T>(key);
    if (pendingWidget) {
      return pendingWidget as MaybePromise<T>;
    }
    return undefined;
  }

  private findExistingWidget<T extends Widget>(
    key: string
  ): MaybePromise<T> | undefined {
    const parsed = this.parseJson(key);
    for (const [candidateKey, widget] of [
      ...this.widgetPromises.entries(),
      ...this.pendingWidgetPromises.entries(),
    ]) {
      const candidate = this.parseJson(candidateKey);
      if (deepEqual(candidate, parsed)) {
        return widget as MaybePromise<T>;
      }
    }
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseJson(json: string): any {
    try {
      return JSON.parse(json);
    } catch (err) {
      console.log(`Failed to parse JSON: <${json}>.`, err);
      throw err;
    }
  }
}
