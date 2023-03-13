import type { MessageService } from '@theia/core/lib/common/message-service';
import {
  coerce as coerceSemver,
  compare as compareSemver,
  parse as parseSemver,
} from 'semver';
import { naturalCompare } from '../utils';
import type { ArduinoComponent } from './arduino-component';
import { ExecuteWithProgress } from './progressible';
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
     * If `coerce` is `true` tries to convert any invalid semver strings to a valid semver based on [these](https://github.com/npm/node-semver#coercion) rules.
     */
    export const COMPARATOR = (
      left: Version,
      right: Version,
      coerce = false
    ): number => {
      const validLeft = parseSemver(left);
      const validRight = parseSemver(right);
      if (validLeft && validRight) {
        return compareSemver(validLeft, validRight);
      }
      if (coerce) {
        const coercedLeft = validLeft ?? coerceSemver(left);
        const coercedRight = validRight ?? coerceSemver(right);
        if (coercedLeft && coercedRight) {
          return compareSemver(coercedLeft, coercedRight);
        }
      }
      return naturalCompare(left, right);
    };
  }

  export const ActionLiterals = [
    'installLatest',
    'installSelected',
    'update',
    'remove',
    'unknown',
  ] as const;
  export type Action = typeof ActionLiterals[number];

  export function action(params: {
    installed?: Version | undefined;
    available: Version[];
    selected?: Version;
  }): Action {
    const { installed, available } = params;
    const latest = Installable.latest(available);
    if (!latest || (installed && !available.includes(installed))) {
      return 'unknown';
    }
    const selected = params.selected ?? latest;
    if (installed === selected) {
      return 'remove';
    }
    if (installed) {
      return selected === latest && installed !== latest
        ? 'update'
        : 'installSelected';
    } else {
      return selected === latest ? 'installLatest' : 'installSelected';
    }
  }

  export function latest(versions: Version[]): Version | undefined {
    if (!versions.length) {
      return undefined;
    }
    const ordered = versions.slice().sort(Installable.Version.COMPARATOR);
    return ordered[ordered.length - 1];
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
