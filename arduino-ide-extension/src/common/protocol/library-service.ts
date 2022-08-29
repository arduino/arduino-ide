import { Searchable } from './searchable';
import { Installable } from './installable';
import { ArduinoComponent } from './arduino-component';
import { nls } from '@theia/core/lib/common/nls';
import {
  All,
  Contributed,
  Partner,
  Recommended,
  Retired,
  Type,
  Updatable,
} from '../nls';

export const LibraryServicePath = '/services/library-service';
export const LibraryService = Symbol('LibraryService');
export interface LibraryService
  extends Installable<LibraryPackage>,
    Searchable<LibraryPackage, LibrarySearch> {
  list(options: LibraryService.List.Options): Promise<LibraryPackage[]>;
  search(options: LibrarySearch): Promise<LibraryPackage[]>;
  /**
   * When `installDependencies` is not set, it is `true` by default. If you want to skip the installation of required dependencies, set it to `false`.
   */
  install(options: {
    item: LibraryPackage;
    progressId?: string;
    version?: Installable.Version;
    installDependencies?: boolean;
    noOverwrite?: boolean;
  }): Promise<void>;
  installZip(options: {
    zipUri: string;
    progressId?: string;
    overwrite?: boolean;
  }): Promise<void>;
  /**
   * Set `filterSelf` to `true` if you want to avoid having `item` in the result set.
   * Note: as of today (22.02.2021), the CLI works like this: `./arduino-cli lib deps Adaino@0.1.0 ✕ Adaino 0.1.0 must be installed.`.
   */
  listDependencies({
    item,
    version,
    filterSelf,
  }: {
    item: LibraryPackage;
    version: Installable.Version;
    filterSelf?: boolean;
  }): Promise<LibraryDependency[]>;
}

export interface LibrarySearch extends Searchable.Options {
  readonly type?: LibrarySearch.Type;
  readonly topic?: LibrarySearch.Topic;
}
export namespace LibrarySearch {
  export const TypeLiterals = [
    'All',
    'Updatable',
    'Installed',
    'Arduino',
    'Partner',
    'Recommended',
    'Contributed',
    'Retired',
  ] as const;
  export type Type = typeof TypeLiterals[number];
  export const TypeLabels: Record<Type, string> = {
    All: All,
    Updatable: Updatable,
    Installed: nls.localize('arduino/libraryType/installed', 'Installed'),
    Arduino: 'Arduino',
    Partner: Partner,
    Recommended: Recommended,
    Contributed: Contributed,
    Retired: Retired,
  };
  export const TopicLiterals = [
    'All',
    'Communication',
    'Data Processing',
    'Data Storage',
    'Device Control',
    'Display',
    'Others',
    'Sensors',
    'Signal Input/Output',
    'Timing',
    'Uncategorized',
  ];
  export type Topic = typeof TopicLiterals[number];
  export const TopicLabels: Record<Topic, string> = {
    All: All,
    Communication: nls.localize(
      'arduino/libraryTopic/communication',
      'Communication'
    ),
    'Data Processing': nls.localize(
      'arduino/libraryTopic/dataProcessing',
      'Data Processing'
    ),
    'Data Storage': nls.localize(
      'arduino/libraryTopic/dataStorage',
      'Date Storage'
    ),
    'Device Control': nls.localize(
      'arduino/libraryTopic/deviceControl',
      'Device Control'
    ),
    Display: nls.localize('arduino/libraryTopic/display', 'Display'),
    Others: nls.localize('arduino/libraryTopic/others', 'Others'),
    Sensors: nls.localize('arduino/libraryTopic/sensors', 'Sensors'),
    'Signal Input/Output': nls.localize(
      'arduino/libraryTopic/signalInputOutput',
      'Signal Input/Output'
    ),
    Timing: nls.localize('arduino/libraryTopic/timing', 'Timing'),
    Uncategorized: nls.localize(
      'arduino/libraryTopic/uncategorized',
      'Uncategorized'
    ),
  };
  export const PropertyLabels: Record<
    keyof Omit<LibrarySearch, 'query'>,
    string
  > = {
    topic: nls.localize('arduino/librarySearchProperty/topic', 'Topic'),
    type: Type,
  };
}

export namespace LibraryService {
  export namespace List {
    export interface Options {
      readonly fqbn?: string | undefined;
    }
  }
}

export enum LibraryLocation {
  /**
   * In the `libraries` subdirectory of the Arduino IDE installation.
   */
  IDE_BUILTIN = 0,

  /**
   * In the `libraries` subdirectory of the user directory (sketchbook).
   */
  USER = 1,

  /**
   * In the `libraries` subdirectory of a platform.
   */
  PLATFORM_BUILTIN = 2,

  /**
   * When `LibraryLocation` is used in a context where a board is specified, this indicates the library is in the `libraries`
   * subdirectory of a platform referenced by the board's platform.
   */
  REFERENCED_PLATFORM_BUILTIN = 3,
}

export interface LibraryPackage extends ArduinoComponent {
  /**
   * Same as [`Library#real_name`](https://arduino.github.io/arduino-cli/latest/rpc/commands/#library).
   * Should be used for the UI, and `name` is used to uniquely identify a library. It does not have an ID.
   */
  readonly label: string;

  /**
   * An array of string that should be included into the `ino` file if this library is used.
   * For example, including `SD` will prepend `#include <SD.h>` to the `ino` file. While including `Bridge`
   * requires multiple `#include` declarations: `YunClient`, `YunServer`, `Bridge`, etc.
   */
  readonly includes: string[];
  readonly exampleUris: string[];
  readonly location: LibraryLocation;
  readonly installDirUri?: string;
  /**
   * This is the `Topic` in the IDE (1.x) UI.
   */
  readonly category: string;
}
export namespace LibraryPackage {
  export function is(arg: any): arg is LibraryPackage {
    return (
      ArduinoComponent.is(arg) &&
      'includes' in arg &&
      Array.isArray(arg['includes'])
    );
  }

  export function equals(left: LibraryPackage, right: LibraryPackage): boolean {
    return left.name === right.name && left.author === right.author;
  }

  export function groupByLocation(packages: LibraryPackage[]): {
    user: LibraryPackage[];
    rest: LibraryPackage[];
  } {
    const user: LibraryPackage[] = [];
    const rest: LibraryPackage[] = [];
    for (const pkg of packages) {
      if (pkg.location === LibraryLocation.USER) {
        user.push(pkg);
      } else {
        rest.push(pkg);
      }
    }
    return { user, rest };
  }
}

export interface LibraryDependency {
  readonly name: string;
  readonly requiredVersion: Installable.Version;
  readonly installedVersion: Installable.Version;
}
