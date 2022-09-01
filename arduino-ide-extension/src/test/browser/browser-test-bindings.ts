import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { bindCommon } from '../common/common-test-bindings';

export function createBaseContainer(): Container {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(new ContainerModule((bind) => bindCommon(bind)));
  return container;
}
