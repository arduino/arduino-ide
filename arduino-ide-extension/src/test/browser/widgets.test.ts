import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import type { PanelLayout, Widget } from '@theia/core/shared/@phosphor/widgets';
import { expect } from 'chai';
import type {
  removeWidgetIfPresent,
  unshiftWidgetIfNotPresent,
} from '../../browser/theia/dialogs/widgets';

describe('widgets', () => {
  let toDispose: DisposableCollection;

  beforeEach(() => {
    const disableJSDOM =
      require('@theia/core/lib/browser/test/jsdom').enableJSDOM();
    toDispose = new DisposableCollection(
      Disposable.create(() => disableJSDOM())
    );
  });

  afterEach(() => toDispose.dispose());

  describe('removeWidgetIfPresent', () => {
    let testMe: typeof removeWidgetIfPresent;

    beforeEach(
      () =>
        (testMe =
          require('../../browser/theia/dialogs/widgets').removeWidgetIfPresent)
    );

    it('should remove the widget if present', () => {
      const layout = newPanelLayout();
      const widget = newWidget();
      layout.addWidget(widget);
      const toRemoveWidget = newWidget();
      layout.addWidget(toRemoveWidget);

      expect(layout.widgets).to.be.deep.equal([widget, toRemoveWidget]);

      testMe(layout, toRemoveWidget);

      expect(layout.widgets).to.be.deep.equal([widget]);
    });

    it('should be noop if the widget is not part of the layout', () => {
      const layout = newPanelLayout();
      const widget = newWidget();
      layout.addWidget(widget);

      expect(layout.widgets).to.be.deep.equal([widget]);

      testMe(layout, newWidget());

      expect(layout.widgets).to.be.deep.equal([widget]);
    });
  });

  describe('unshiftWidgetIfNotPresent', () => {
    let testMe: typeof unshiftWidgetIfNotPresent;

    beforeEach(
      () =>
        (testMe =
          require('../../browser/theia/dialogs/widgets').unshiftWidgetIfNotPresent)
    );

    it('should unshift the widget if not present', () => {
      const layout = newPanelLayout();
      const widget = newWidget();
      layout.addWidget(widget);

      expect(layout.widgets).to.be.deep.equal([widget]);

      const toAdd = newWidget();
      testMe(layout, toAdd);

      expect(layout.widgets).to.be.deep.equal([toAdd, widget]);
    });

    it('should be NOOP if widget is already part of the layout (at 0 index)', () => {
      const layout = newPanelLayout();
      const toAdd = newWidget();
      layout.addWidget(toAdd);
      const widget = newWidget();
      layout.addWidget(widget);

      expect(layout.widgets).to.be.deep.equal([toAdd, widget]);

      testMe(layout, toAdd);

      expect(layout.widgets).to.be.deep.equal([toAdd, widget]);
    });

    it('should be NOOP if widget is already part of the layout (at >0 index)', () => {
      const layout = newPanelLayout();
      const widget = newWidget();
      layout.addWidget(widget);
      const toAdd = newWidget();
      layout.addWidget(toAdd);

      expect(layout.widgets).to.be.deep.equal([widget, toAdd]);

      testMe(layout, toAdd);

      expect(layout.widgets).to.be.deep.equal([widget, toAdd]);
    });
  });

  function newWidget(): Widget {
    const { Widget } = require('@theia/core/shared/@phosphor/widgets');
    return new Widget();
  }

  function newPanelLayout(): PanelLayout {
    const { PanelLayout } = require('@theia/core/shared/@phosphor/widgets');
    return new PanelLayout();
  }
});
