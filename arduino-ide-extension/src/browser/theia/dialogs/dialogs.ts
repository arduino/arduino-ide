import { injectable, inject } from '@theia/core/shared/inversify';

import {
  AbstractDialog as TheiaAbstractDialog,
  codiconArray,
  DialogProps,
} from '@theia/core/lib/browser';

@injectable()
export abstract class AbstractDialog<T> extends TheiaAbstractDialog<T> {
  constructor(@inject(DialogProps) protected override readonly props: DialogProps) {
    super(props);

    this.closeCrossNode.classList.remove(...codiconArray('close'));
    this.closeCrossNode.classList.add('fa', 'fa-close');
  }
}
