import fs from 'node:fs';
import tempDir from 'temp-dir';
import { isWindows, isOSX } from '@theia/core/lib/common/os';
import { injectable } from '@theia/core/shared/inversify';
import safeLogger from './safe-logger';
import { firstToLowerCase } from '../common/utils';

export const Win32DriveRegex = /^[a-zA-Z]:\\/;
export const TempSketchPrefix = '.arduinoIDE-unsaved';

@injectable()
export class IsTempSketch {
  // If on macOS, the `temp-dir` lib will make sure there is resolved realpath.
  // If on Windows, the `C:\Users\KITTAA~1\AppData\Local\Temp` path will be resolved and normalized to `c:\Users\kittaakos\AppData\Local\Temp`.
  // Note: VS Code URI normalizes the drive letter. `C:` will be converted into `c:`.
  // https://github.com/Microsoft/vscode/issues/68325#issuecomment-462239992
  readonly tempDirRealpath = isOSX
    ? tempDir
    : maybeNormalizeDrive(fs.realpathSync.native(tempDir));

  is(sketchPath: string): boolean {
    // Consider the following paths:
    // macOS:
    // - Temp folder: /var/folders/k3/d2fkvv1j16v3_rz93k7f74180000gn/T
    // - Sketch folder: /private/var/folders/k3/d2fkvv1j16v3_rz93k7f74180000gn/T/arduino-ide2-A0337D47F86B24A51DF3DBCF2CC17925
    // Windows:
    // - Temp folder: C:\Users\KITTAA~1\AppData\Local\Temp
    // - Sketch folder: c:\Users\kittaakos\AppData\Local\Temp\.arduinoIDE-unsaved2022431-21824-116kfaz.9ljl\sketch_may31a
    // Both sketches are valid and temp, but this function will give a false-negative result if we use the default `os.tmpdir()` logic.
    const normalizedSketchPath = maybeNormalizeDrive(sketchPath);
    const result =
      normalizedSketchPath.startsWith(this.tempDirRealpath) &&
      normalizedSketchPath.includes(TempSketchPrefix);
    // Avoid writing to stdout/stderr directly in production code because
    // Electron main process can have closed stdio causing write EPIPE errors.
    // Wrap debug logging in a try/catch so it won't crash the main process.
  // Use centralized safe logger to avoid throwing when stdio is closed
  safeLogger.debug(`isTempSketch: ${result}. Input was ${normalizedSketchPath}`);
    return result;
  }
}

/**
 * If on Windows, will change the input `C:\\path\\to\\somewhere` to `c:\\path\\to\\somewhere`.
 * Otherwise, returns with the argument.
 */
export function maybeNormalizeDrive(fsPath: string): string {
  if (isWindows && Win32DriveRegex.test(fsPath)) {
    return firstToLowerCase(fsPath);
  }
  return fsPath;
}
