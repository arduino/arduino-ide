import * as semver from 'semver';
import { ExecuteWithProgress } from './progressible';
import { naturalCompare } from '../utils';
import type { ArduinoComponent } from './arduino-component';
import type { MessageService } from '@theia/core/lib/common/message-service';
import type { ResponseServiceClient } from './response-service';

export interface Installable<T extends ArduinoComponent> {
  /**
   * If `options.version` is specified, that will be installed. Otherwise, `item.availableVersions[0]`.
   */
  install(options: {
    item: T;
    progressId?: string;
    version?: Installable.Version;
    noOverwrite?: boolean;
  }): Promise<void>;

  /**
   * Uninstalls the given component. It is a NOOP if not installed.
   */
  uninstall(options: { item: T; progressId?: string }): Promise<void>;
}
export namespace Installable {
  export type Version = string;

  export namespace Version {
    /**
     * Most recent version comes first, then the previous versions. (`1.8.1`, `1.6.3`, `1.6.2`, `1.6.1` and so on.)
     *
     * If `coerced` is `true` tries to convert any invalid semver strings to a valid semver based on [these](https://github.com/npm/node-semver#coercion) rules.
     */
    export const COMPARATOR = (
      left: Version,
      right: Version,
      coerce = false
    ): number => {
      const validLeft = semver.parse(left);
      const validRight = semver.parse(right);
      if (validLeft && validRight) {
        return semver.compare(validLeft, validRight);
      }
      if (coerce) {
        const coercedLeft = validLeft ?? semver.coerce(left);
        const coercedRight = validRight ?? semver.coerce(right);
        if (coercedLeft && coercedRight) {
          return semver.compare(coercedLeft, coercedRight);
        }
      }
      return naturalCompare(left, right);
    };
  }

  export const Installed = <T extends ArduinoComponent>({
    installedVersion,
  }: T): boolean => {
    return !!installedVersion;
  };

  export const Updateable = <T extends ArduinoComponent>(item: T): boolean => {
    const { installedVersion } = item;
    if (!installedVersion) {
      return false;
    }
    const latestVersion = item.availableVersions[0];
    if (!latestVersion) {
      console.warn(
        `Installed version ${installedVersion} is available for ${item.name}, but no available versions were available. Skipping.`
      );
      return false;
    }
    const result = Installable.Version.COMPARATOR(
      latestVersion,
      installedVersion,
      true
    );
    return result > 0;
  };

  export async function installWithProgress<
    T extends ArduinoComponent
  >(options: {
    installable: Installable<T>;
    messageService: MessageService;
    responseService: ResponseServiceClient;
    item: T;
    version: Installable.Version;
    keepOutput?: boolean;
  }): Promise<void> {
    const { item, version } = options;
    return ExecuteWithProgress.doWithProgress({
      ...options,
      progressText: `Processing ${item.name}:${version}`,
      run: ({ progressId }) =>
        options.installable.install({
          item: options.item,
          version: options.version,
          progressId,
        }),
    });
  }

  export async function uninstallWithProgress<
    T extends ArduinoComponent
  >(options: {
    installable: Installable<T>;
    messageService: MessageService;
    responseService: ResponseServiceClient;
    item: T;
    keepOutput?: boolean;
  }): Promise<void> {
    const { item } = options;
    return ExecuteWithProgress.doWithProgress({
      ...options,
      progressText: `Processing ${item.name}${
        item.installedVersion ? `:${item.installedVersion}` : ''
      }`,
      run: ({ progressId }) =>
        options.installable.uninstall({
          item: options.item,
          progressId,
        }),
    });
  }
}
