import { URI } from '@theia/core/lib/common/uri';
import {
  inject,
  injectable,
  postConstruct,
} from '@theia/core/shared/inversify';
import {
  PluginDeployerResolver,
  PluginDeployerResolverContext,
} from '@theia/plugin-ext/lib/common/plugin-protocol';
import { PluginDeployerImpl } from '@theia/plugin-ext/lib/main/node/plugin-deployer-impl';
import { LocalDirectoryPluginDeployerResolver } from '@theia/plugin-ext/lib/main/node/resolvers/local-directory-plugin-deployer-resolver';
import { constants, promises as fs } from 'fs';
import { isAbsolute, resolve } from 'path';

@injectable()
export class LocalDirectoryPluginDeployerResolverWithFallback extends LocalDirectoryPluginDeployerResolver {
  override async resolve(
    pluginResolverContext: PluginDeployerResolverContext
  ): Promise<void> {
    const origin = pluginResolverContext.getOriginId();
    // The original implementation must not run when there is a hash in the path. Otherwise, it can resolve an undesired directory.
    // Consider app under c:\Users\username\Desktop\# here is my app\
    // Then the flawed logic will incorrectly find c:\Users\username\Desktop location after stripping the rest of the path after the hash.
    // The implementation which provides a workaround for the hash in the path assumes that the original Theia logic is correct, when no hash present in the URI path.
    let localPath: string | null;
    if (origin.includes('#')) {
      localPath = await resolveLocalPluginPathFallback(
        pluginResolverContext,
        this.supportedScheme
      );
    } else {
      localPath = await this.originalResolveLocalPluginPath(
        pluginResolverContext,
        this.supportedScheme
      );
    }
    if (localPath) {
      await this.resolveFromLocalPath(pluginResolverContext, localPath);
    }
  }

  private async originalResolveLocalPluginPath(
    context: PluginDeployerResolverContext,
    scheme: string
  ): Promise<string | null> {
    const object = <Record<string, unknown>>this;
    if (
      'resolveLocalPluginPath' in object &&
      typeof object['resolveLocalPluginPath'] === 'function'
    ) {
      return object['resolveLocalPluginPath'](context, scheme);
    }
    return null;
  }
}

async function resolveLocalPluginPathFallback(
  context: PluginDeployerResolverContext,
  scheme: string
): Promise<string | null> {
  const uri = new URI(context.getOriginId());
  if (uri.scheme === scheme) {
    const unencodedRawUri = uri.toString(true);
    let fsPath = unencodedRawUri.substring(`${scheme}:`.length);
    if (!isAbsolute(fsPath)) {
      fsPath = resolve(process.cwd(), fsPath);
    }
    try {
      await fs.access(fsPath, constants.R_OK);
      return fsPath;
    } catch {
      console.warn(
        `The local plugin referenced by ${context.getOriginId()} does not exist.`
      );
    }
  }
  return null;
}

@injectable()
export class PluginDeployer_GH_12064 extends PluginDeployerImpl {
  @inject(LocalDirectoryPluginDeployerResolverWithFallback)
  private readonly pluginResolver: LocalDirectoryPluginDeployerResolverWithFallback;

  @postConstruct()
  protected adjustPluginResolvers(): void {
    const pluginResolvers = <PluginDeployerResolver[]>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).pluginResolvers
    );
    const index = pluginResolvers.findIndex(
      (pluginResolver) =>
        pluginResolver instanceof LocalDirectoryPluginDeployerResolver
    );
    if (index >= 0) {
      pluginResolvers.splice(index, 1, this.pluginResolver);
    }
  }
}
