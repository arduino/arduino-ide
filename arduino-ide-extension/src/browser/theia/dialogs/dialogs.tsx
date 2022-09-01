import {
  AbstractDialog as TheiaAbstractDialog,
  DialogProps,
} from '@theia/core/lib/browser/dialogs';
import { ReactDialog as TheiaReactDialog } from '@theia/core/lib/browser/dialogs/react-dialog';
import { codiconArray, Message } from '@theia/core/lib/browser/widgets/widget';
import {
  Disposable,
  DisposableCollection,
} from '@theia/core/lib/common/disposable';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { createRoot } from '@theia/core/shared/react-dom/client';

@injectable()
export abstract class AbstractDialog<T> extends TheiaAbstractDialog<T> {
  constructor(
    @inject(DialogProps) protected override readonly props: DialogProps
  ) {
    super(props);
    this.closeCrossNode.classList.remove(...codiconArray('close'));
    this.closeCrossNode.classList.add('fa', 'fa-close');
  }
}

@injectable()
export abstract class ReactDialog<T> extends TheiaReactDialog<T> {
  protected override onUpdateRequest(msg: Message): void {
    // This is tricky to bypass the default Theia code.
    // Otherwise, there is a warning when opening the dialog for the second time.
    // You are calling ReactDOMClient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it.
    const disposables = new DisposableCollection();
    if (!this.isMounted) {
      // toggle the `isMounted` logic for the time being of the super call so that the `createRoot` does not run
      this.isMounted = true;
      disposables.push(Disposable.create(() => (this.isMounted = false)));
    }

    // Always unset the `contentNodeRoot` so there is no double update when calling super.
    const restoreContentNodeRoot = this.contentNodeRoot;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.contentNodeRoot as any) = undefined;
    disposables.push(
      Disposable.create(() => (this.contentNodeRoot = restoreContentNodeRoot))
    );

    try {
      super.onUpdateRequest(msg);
    } finally {
      disposables.dispose();
    }

    // Use the patched rendering.
    if (!this.isMounted) {
      this.contentNodeRoot = createRoot(this.contentNode);
      // Resetting the prop is missing from the Theia code.
      // https://github.com/eclipse-theia/theia/blob/v1.31.1/packages/core/src/browser/dialogs/react-dialog.tsx#L41-L47
      this.isMounted = true;
    }
    this.contentNodeRoot?.render(<>{this.render()}</>);
  }
}
