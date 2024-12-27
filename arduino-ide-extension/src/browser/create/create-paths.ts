export const posix = { sep: '/' };

// TODO: poor man's `path.join(path, '..')` in the browser.
export function parentPosix(path: string): string {
  const segments = path.split(posix.sep) || [];
  segments.pop();
  let modified = segments.join(posix.sep);
  if (path.charAt(path.length - 1) === posix.sep) {
    modified += posix.sep;
  }
  return modified;
}

export function basename(path: string): string {
  const segments = path.split(posix.sep) || [];
  return segments.pop()!;
}

export function posixSegments(posixPath: string): string[] {
  return posixPath.split(posix.sep).filter((segment) => !!segment);
}

/**
 * Splits the `raw` path into two segments, a root that contains user information and the relevant POSIX path. \
 * For examples:
 * ```
 * `29ad0829759028dde9b877343fa3b0e1:testrest/sketches_v2/xxx_folder/xxx_sub_folder/sketch_in_folder/sketch_in_folder.ino`
 * ```
 * will be:
 * ```
 * ['29ad0829759028dde9b877343fa3b0e1:testrest/sketches_v2', '/xxx_folder/xxx_sub_folder/sketch_in_folder/sketch_in_folder.ino']
 * ```
 */
export function splitSketchPath(
  raw: string,
  sep = '/sketches_v2/'
): [string, string] {
  if (!sep) {
    throw new Error('Invalid separator. Cannot be zero length.');
  }
  const index = raw.indexOf(sep);
  if (index === -1) {
    throw new Error(`Invalid path pattern. Raw path was '${raw}'.`);
  }
  const createRoot = raw.substring(0, index + sep.length - 1); // TODO: validate the `createRoot` format.
  const posixPath = raw.substr(index + sep.length - 1);
  if (!posixPath) {
    throw new Error(`Could not extract POSIX path from '${raw}'.`);
  }
  return [createRoot, posixPath];
}

export function toPosixPath(raw: string): string {
  if (raw === posix.sep) {
    return posix.sep; // Handles the root resource case.
  }
  const [, posixPath] = splitSketchPath(raw);
  return posixPath;
}
