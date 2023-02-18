import { injectable } from '@theia/core/shared/inversify';
import { TypeHierarchyServiceProvider as TheiaTypeHierarchyServiceProvider } from '@theia/typehierarchy/lib/browser/typehierarchy-service';

@injectable()
export class TypeHierarchyServiceProvider extends TheiaTypeHierarchyServiceProvider {
  override init(): void {
    // NOOP
  }
}
