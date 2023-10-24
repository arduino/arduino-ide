import { ApplicationError } from '@theia/core/lib/common/application-error';
import { nls } from '@theia/core/lib/common/nls';
import URI from '@theia/core/lib/common/uri';
import dateFormat from 'dateformat';
const filenameReservedRegex = require('filename-reserved-regex');

export namespace SketchesError {
  export const Codes = {
    NotFound: 5001,
    InvalidName: 5002,
  };
  export const NotFound = ApplicationError.declare(
    Codes.NotFound,
    (message: string, uri: string) => {
      return {
        message,
        data: { uri },
      };
    }
  );
  export const InvalidName = ApplicationError.declare(
    Codes.InvalidName,
    (message: string, invalidMainSketchUri: string) => {
      return {
        message,
        data: { invalidMainSketchUri },
      };
    }
  );
}

export const SketchesServicePath = '/services/sketches-service';
export const SketchesService = Symbol('SketchesService');
export interface SketchesService {
  /**
   * Resolves to a sketch container representing the hierarchical structure of the sketches.
   * If `uri` is not given, `directories.user` will be user instead.
   */
  getSketches({ uri }: { uri?: string }): Promise<SketchContainer>;

  /**
   * This is the TS implementation of `SketchLoad` from the CLI and should be replaced with a gRPC call eventually.
   * See: https://github.com/arduino/arduino-cli/issues/837
   * Based on: https://github.com/arduino/arduino-cli/blob/eef3705c4afcba4317ec38b803d9ffce5dd59a28/arduino/builder/sketch.go#L100-L215
   */
  loadSketch(uri: string): Promise<Sketch>;

  /**
   * Unlike `loadSketch`, this method gracefully resolves to `undefined` instead or rejecting if the `uri` is not a sketch folder.
   */
  maybeLoadSketch(uri: string): Promise<Sketch | undefined>;

  /**
   * Creates a new sketch folder in the temp location.
   */
  createNewSketch(): Promise<Sketch>;

  /**
   * The default content when creating a new `.ino` file. Either the built-in or the user defined (`arduino.sketch.inoBlueprint`) content.
   */
  defaultInoContent(): Promise<string>;

  /**
   * Creates a new sketch with existing content. Rejects if `uri` is not pointing to a valid sketch folder.
   */
  cloneExample(uri: string): Promise<Sketch>;

  isSketchFolder(uri: string): Promise<boolean>;

  /**
   * Sketches are created to the temp location by default and will be moved under `directories.user` on save.
   * This method resolves to `true` if the `sketch` is still in the temp location. Otherwise, `false`.
   */
  isTemp(sketch: SketchRef): Promise<boolean>;

  /**
   * Recursively copies the sketch folder content including all files into the destination folder.
   * Resolves with the new URI of the sketch after the move. This method always overrides. It's the callers responsibility to ask the user whether
   * the files at the destination can be overwritten or not. This method copies all filesystem files, if you want to copy only sketch files,
   * but exclude, for example, language server log file, set the `onlySketchFiles` property to `true`. `onlySketchFiles` is `false` by default.
   */
  copy(
    sketch: Sketch,
    options: { destinationUri: string; onlySketchFiles?: boolean }
  ): Promise<Sketch>;

  /**
   * Returns with the container sketch for the input `uri`. If the `uri` is not in a sketch folder, the promise resolves to `undefined`.
   */
  getSketchFolder(uri: string): Promise<Sketch | undefined>;

  /**
   * Marks the sketch with the given URI as recently opened. It does nothing if the sketch is temp or not valid.
   */
  markAsRecentlyOpened(uri: string): Promise<void>;

  /**
   * Resolves to an array of sketches in inverse chronological order. The newest is the first.
   * If `forceUpdate` is `true`, the array of recently opened sketches will be recalculated.
   * Invalid and missing sketches will be removed from the list. It's `false` by default.
   */
  recentlyOpenedSketches(forceUpdate?: boolean): Promise<Sketch[]>;

  /**
   * Archives the sketch, resolves to the archive URI.
   */
  archive(sketch: Sketch, destinationUri: string): Promise<string>;

  /**
   * Counterpart of the CLI's `genBuildPath` functionality.
   * Based on https://github.com/arduino/arduino-cli/blob/550179eefd2d2bca299d50a4af9e9bfcfebec649/arduino/builder/builder.go#L30-L38
   */
  getIdeTempFolderUri(sketch: Sketch): Promise<string>;

  /**
   * This is the JS/TS re-implementation of [`GenBuildPath`](https://github.com/arduino/arduino-cli/blob/c0d4e4407d80aabad81142693513b3306759cfa6/arduino/sketch/sketch.go#L296-L306) of the CLI.
   * Pass in a sketch and get the build temporary folder filesystem path calculated from the main sketch file location. Can be multiple ones. This method does not check the existence of the sketch.
   *
   * The case sensitivity of the drive letter on Windows matters when the CLI calculates the MD5 hash of the temporary build folder.
   * IDE2 does not know and does not want to rely on how the CLI treats the paths: with lowercase or uppercase drive letters.
   * Hence, IDE2 has to provide multiple build paths on Windows. This hack will be obsolete when the CLI can provide error codes:
   * https://github.com/arduino/arduino-cli/issues/1762.
   */
  tempBuildPath(sketch: Sketch): Promise<string[]>;
}

export interface SketchRef {
  readonly name: string;
  readonly uri: string; // `LocationPath`
}
export namespace SketchRef {
  export function fromUri(uriLike: string | URI): SketchRef {
    const uri = typeof uriLike === 'string' ? new URI(uriLike) : uriLike;
    return {
      name: uri.path.base,
      uri: typeof uriLike === 'string' ? uriLike : uriLike.toString(),
    };
  }
  export function is(arg: unknown): arg is SketchRef {
    if (typeof arg === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const object = arg as any;
      return (
        'name' in object &&
        typeof object['name'] === 'string' &&
        'uri' in object &&
        typeof object['name'] === 'string'
      );
    }
    return false;
  }
}
export interface Sketch extends SketchRef {
  readonly mainFileUri: string; // `MainFile`
  readonly otherSketchFileUris: string[]; // `OtherSketchFiles`
  readonly additionalFileUris: string[]; // `AdditionalFiles`
  readonly rootFolderFileUris: string[]; // `RootFolderFiles` (does not include the main sketch file)
}
export namespace Sketch {
  // (non-API) exported for the tests
  export const defaultSketchFolderName = 'sketch';
  // (non-API) exported for the tests
  export const defaultFallbackChar = '_';
  // (non-API) exported for the tests
  export function reservedFilename(name: string): string {
    return nls.localize(
      'arduino/sketch/reservedFilename',
      "'{0}' is a reserved filename.",
      name
    );
  }
  // (non-API) exported for the tests
  export const noTrailingPeriod = nls.localize(
    'arduino/sketch/noTrailingPeriod',
    'A filename cannot end with a dot'
  );
  // (non-API) exported for the tests
  export const invalidSketchFolderNameMessage = nls.localize(
    'arduino/sketch/invalidSketchName',
    'The name must start with a letter, number, or underscore, followed by letters, numbers, dashes, dots and underscores. Maximum length is 63 characters.'
  );
  const invalidCloudSketchFolderNameMessage = nls.localize(
    'arduino/sketch/invalidCloudSketchName',
    'The name must start with a letter, number, or underscore, followed by letters, numbers, dashes, dots and underscores. Maximum length is 36 characters.'
  );
  /**
   * `undefined` if the candidate sketch folder name is valid. Otherwise, the validation error message.
   * Based on the [specs](https://arduino.github.io/arduino-cli/latest/sketch-specification/#sketch-folders-and-files).
   */
  export function validateSketchFolderName(
    candidate: string
  ): string | undefined {
    const validFilenameError = isValidFilename(candidate);
    if (validFilenameError) {
      return validFilenameError;
    }
    return /^[0-9a-zA-Z_]{1}[0-9a-zA-Z_\.-]{0,62}$/.test(candidate)
      ? undefined
      : invalidSketchFolderNameMessage;
  }

  /**
   * `undefined` if the candidate cloud sketch folder name is valid. Otherwise, the validation error message.
   */
  export function validateCloudSketchFolderName(
    candidate: string
  ): string | undefined {
    const validFilenameError = isValidFilename(candidate);
    if (validFilenameError) {
      return validFilenameError;
    }
    return /^[0-9a-zA-Z_]{1}[0-9a-zA-Z_\.-]{0,35}$/.test(candidate)
      ? undefined
      : invalidCloudSketchFolderNameMessage;
  }

  function isValidFilename(candidate: string): string | undefined {
    if (isReservedFilename(candidate)) {
      return reservedFilename(candidate);
    }
    if (endsWithPeriod(candidate)) {
      return noTrailingPeriod;
    }
    return undefined;
  }

  function endsWithPeriod(candidate: string): boolean {
    return candidate.length > 1 && candidate[candidate.length - 1] === '.';
  }

  function isReservedFilename(candidate: string): boolean {
    return (
      filenameReservedRegex().test(candidate) ||
      filenameReservedRegex.windowsNames().test(candidate)
    );
  }

  /**
   * Transforms the `candidate` argument into a valid sketch folder name by replacing all invalid characters with underscore (`_`) and trimming the string after 63 characters.
   * If the argument is falsy, returns with `"sketch"`.
   */
  export function toValidSketchFolderName(
    candidate: string,
    /**
     * Type of `Date` is only for tests. Use boolean for production.
     */
    appendTimestampSuffix: boolean | Date = false
  ): string {
    if (
      !appendTimestampSuffix &&
      filenameReservedRegex.windowsNames().test(candidate)
    ) {
      return defaultSketchFolderName;
    }
    const validName = candidate
      ? candidate.replace(/[^0-9a-zA-Z_]/g, defaultFallbackChar).slice(0, 63)
      : defaultSketchFolderName;
    if (appendTimestampSuffix) {
      return `${validName.slice(0, 63 - timestampSuffixLength)}${
        typeof appendTimestampSuffix === 'boolean'
          ? timestampSuffix()
          : timestampSuffix(appendTimestampSuffix)
      }`;
    }
    return validName;
  }

  const copy = '_copy_';
  const datetimeFormat = 'yyyymmddHHMMss';
  const timestampSuffixLength = copy.length + datetimeFormat.length;
  // (non-API)
  export function timestampSuffix(now = new Date()): string {
    return `${copy}${dateFormat(now, datetimeFormat)}`;
  }

  /**
   * Transforms the `candidate` argument into a valid cloud sketch folder name by replacing all invalid characters with underscore and trimming the string after 36 characters.
   */
  export function toValidCloudSketchFolderName(candidate: string): string {
    if (filenameReservedRegex.windowsNames().test(candidate)) {
      return defaultSketchFolderName;
    }
    return candidate
      ? candidate.replace(/[^0-9a-zA-Z_]/g, defaultFallbackChar).slice(0, 36)
      : defaultSketchFolderName;
  }

  export function is(arg: unknown): arg is Sketch {
    if (!SketchRef.is(arg)) {
      return false;
    }
    if (typeof arg === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const object = arg as any;
      return (
        'mainFileUri' in object &&
        typeof object['mainFileUri'] === 'string' &&
        'otherSketchFileUris' in object &&
        Array.isArray(object['otherSketchFileUris']) &&
        'additionalFileUris' in object &&
        Array.isArray(object['additionalFileUris']) &&
        'rootFolderFileUris' in object &&
        Array.isArray(object['rootFolderFileUris'])
      );
    }
    return false;
  }
  export namespace Extensions {
    export const DEFAULT = '.ino';
    export const MAIN = [DEFAULT, '.pde'];
    export const SOURCE = ['.c', '.cpp', '.S', '.cxx', '.cc'];
    export const CODE_FILES = [
      ...MAIN,
      ...SOURCE,
      '.h',
      '.hh',
      '.hpp',
      '.tpp',
      '.ipp',
    ];
    export const ADDITIONAL = [...CODE_FILES, '.json', '.md', '.adoc'];
    export const ALL = Array.from(new Set([...MAIN, ...SOURCE, ...ADDITIONAL]));
  }
  export function isInSketch(uri: string | URI, sketch: Sketch): boolean {
    return uris(sketch).includes(
      typeof uri === 'string' ? uri : uri.toString()
    );
  }
  export function isSketchFile(arg: string | URI): boolean {
    if (arg instanceof URI) {
      return isSketchFile(arg.toString());
    }
    return Extensions.MAIN.some((ext) => arg.endsWith(ext));
  }
  export function uris(sketch: Sketch): string[] {
    const { mainFileUri, otherSketchFileUris, additionalFileUris } = sketch;
    return [mainFileUri, ...otherSketchFileUris, ...additionalFileUris];
  }
  const primitiveProps: Array<keyof Sketch> = ['name', 'uri', 'mainFileUri'];
  const arrayProps: Array<keyof Sketch> = [
    'additionalFileUris',
    'otherSketchFileUris',
    'rootFolderFileUris',
  ];
  export function sameAs(left: Sketch, right: Sketch): boolean {
    for (const prop of primitiveProps) {
      const leftValue = left[prop];
      const rightValue = right[prop];
      assertIsNotArray(leftValue, prop, left);
      assertIsNotArray(rightValue, prop, right);
      if (leftValue !== rightValue) {
        return false;
      }
    }
    for (const prop of arrayProps) {
      const leftValue = left[prop];
      const rightValue = right[prop];
      assertIsArray(leftValue, prop, left);
      assertIsArray(rightValue, prop, right);
      if (leftValue.length !== rightValue.length) {
        return false;
      }
    }
    for (const prop of arrayProps) {
      const leftValue = left[prop];
      const rightValue = right[prop];
      assertIsArray(leftValue, prop, left);
      assertIsArray(rightValue, prop, right);
      if (
        toSortedString(leftValue as string[]) !==
        toSortedString(rightValue as string[])
      ) {
        return false;
      }
    }
    return true;
  }
  function toSortedString(array: string[]): string {
    return array.slice().sort().join(',');
  }
  function assertIsNotArray(
    toTest: unknown,
    prop: keyof Sketch,
    object: Sketch
  ): void {
    if (Array.isArray(toTest)) {
      throw new Error(
        `Expected a non-array type. Got: ${toTest}. Property was: ${prop}. Object was: ${JSON.stringify(
          object
        )}`
      );
    }
  }
  function assertIsArray(
    toTest: unknown,
    prop: keyof Sketch,
    object: Sketch
  ): void {
    if (!Array.isArray(toTest)) {
      throw new Error(
        `Expected an array type. Got: ${toTest}. Property was: ${prop}. Object was: ${JSON.stringify(
          object
        )}`
      );
    }
  }
}

export interface SketchContainer {
  readonly label: string;
  readonly children: SketchContainer[];
  readonly sketches: SketchRef[];
}
export namespace SketchContainer {
  export function create(label: string): SketchContainer {
    return {
      label,
      children: [],
      sketches: [],
    };
  }
  export function is(arg: any): arg is SketchContainer {
    return (
      !!arg &&
      'label' in arg &&
      typeof arg.label === 'string' &&
      'children' in arg &&
      Array.isArray(arg.children) &&
      'sketches' in arg &&
      Array.isArray(arg.sketches)
    );
  }

  /**
   * `false` if the `container` recursively contains at least one sketch. Otherwise, `true`.
   */
  export function isEmpty(container: SketchContainer): boolean {
    const hasSketch = (parent: SketchContainer) => {
      if (
        parent.sketches.length ||
        parent.children.some((child) => hasSketch(child))
      ) {
        return true;
      }
      return false;
    };
    return !hasSketch(container);
  }

  export function prune<T extends SketchContainer>(container: T): T {
    for (let i = container.children.length - 1; i >= 0; i--) {
      if (isEmpty(container.children[i])) {
        container.children.splice(i, 1);
      }
    }
    return container;
  }

  export function toArray(container: SketchContainer): SketchRef[] {
    const visit = (parent: SketchContainer, toPushSketch: SketchRef[]) => {
      toPushSketch.push(...parent.sketches);
      parent.children.map((child) => visit(child, toPushSketch));
    };
    const sketches: Sketch[] = [];
    visit(container, sketches);
    return sketches;
  }
}
