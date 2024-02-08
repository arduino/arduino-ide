import {
  Layout,
  PanelLayout,
  Widget,
} from '@theia/core/shared/@phosphor/widgets';

/**
 *
 * Removes the widget from the layout if the `layout` is a `PanelLayout` and the widget is present in the layout.
 * Otherwise, it's NOOP
 * @param layout the layout to remove the widget from. Must be a `PanelLayout`.
 * @param toRemove the widget to remove from the layout
 */
export function removeWidgetIfPresent(
  layout: Layout | null,
  toRemove: Widget
): void {
  if (layout instanceof PanelLayout) {
    const index = layout.widgets.indexOf(toRemove);
    if (index < 0) {
      // Unlike the default `PanelLayout#removeWidget` behavior, (https://github.com/phosphorjs/phosphor/blob/9f5e11025b62d2c4a6fb59e2681ae1ed323dcde4/packages/widgets/src/panellayout.ts#L154-L156)
      // do not try to remove widget if it's not present (the index is negative).
      // Otherwise, required widgets could be removed based on the default ArrayExt behavior (https://github.com/phosphorjs/phosphor/blob/9f5e11025b62d2c4a6fb59e2681ae1ed323dcde4/packages/algorithm/src/array.ts#L1075-L1077)
      // See https://github.com/arduino/arduino-ide/issues/2354 for more details.
      return;
    }
    layout.removeWidget(toRemove);
  }
}

/**
 *
 * Inserts the widget to the `0` index of the layout if the `layout` is a `PanelLayout` and the widget is not yet part of the layout.
 * Otherwise, it's NOOP
 * @param layout the layout to add the widget to. Must be a `PanelLayout`.
 * @param toAdd the widget to add to the layout
 */
export function unshiftWidgetIfNotPresent(
  layout: Layout | null,
  toAdd: Widget
): void {
  if (layout instanceof PanelLayout) {
    const index = layout.widgets.indexOf(toAdd);
    if (index >= 0) {
      // Do not try to add the widget to the layout if it's already present.
      // This is the counterpart logic of the `removeWidgetIfPresent` function.
      return;
    }
    layout.insertWidget(0, toAdd);
  }
}
