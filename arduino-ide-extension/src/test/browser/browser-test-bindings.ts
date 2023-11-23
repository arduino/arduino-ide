import { MockLogger } from '@theia/core/lib/common/test/mock-logger';
import { Container, ContainerModule } from '@theia/core/shared/inversify';
import {
  Bind,
  ConsoleLogger,
  bindCommon,
} from '../common/common-test-bindings';

export function createBaseContainer(bind: Bind = bindBrowser): Container {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(new ContainerModule(bind));
  return container;
}

export const bindBrowser: Bind = function (
  ...args: Parameters<Bind>
): ReturnType<Bind> {
  bindCommon(...args);
  const [bind, , , rebind] = args;
  // IDE2's test console logger does not support `Loggable` arg.
  // Rebind logger to suppress `[Function (anonymous)]` messages in tests when the storage service is initialized without `window.localStorage`.
  // https://github.com/eclipse-theia/theia/blob/04c8cf07843ea67402131132e033cdd54900c010/packages/core/src/browser/storage-service.ts#L60
  bind(MockLogger).toSelf().inSingletonScope();
  rebind(ConsoleLogger).toService(MockLogger);
};
