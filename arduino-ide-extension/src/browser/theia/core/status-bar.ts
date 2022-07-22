import { injectable } from '@theia/core/shared/inversify';
import { StatusBarImpl as TheiaStatusBarImpl } from '@theia/core/lib/browser';

@injectable()
export class StatusBarImpl extends TheiaStatusBarImpl {
  override async removeElement(id: string): Promise<void> {
    await this.ready;
    if (this.entries.delete(id)) {
      // Unlike Theia, IDE2 updates the status bar only if the element to remove was among the entries. Otherwise, it's a NOOP.
      this.update();
    }
  }
}
