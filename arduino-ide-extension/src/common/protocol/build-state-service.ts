/**
 * Read-only record of the most recent build (compile or upload) result.
 *
 * Plugins and contributions can inject `BuildStateService` to react to
 * build outcomes without re-running the build themselves — for example to
 * power "rerun last build", to gate features on a successful compile, or
 * to capture artifacts in CI.
 *
 * The IDE writes to this service from `CoreServiceImpl` at the end of
 * every `compile` and `upload`; consumers should treat it as read-only.
 */

export const BuildStateServicePath = '/services/build-state';
export const BuildStateService = Symbol('BuildStateService');

/** A single build (compile or upload) outcome. */
export interface BuildState {
  /** Concatenated build output (stdout + progress messages). */
  readonly output: string;
  /** Compiler or upload error details, empty if the build succeeded. */
  readonly errors: string;
  /** ISO timestamp of when the build completed. */
  readonly timestamp: string;
  /** True if the build finished with exit code 0. */
  readonly success: boolean;
}

export interface BuildStateService {
  /** Returns the most recent build outcome, or `undefined` if none yet. */
  getLastBuild(): Promise<BuildState | undefined>;
  /** Internal use only — called by `CoreServiceImpl`. */
  setLastBuild(state: BuildState): Promise<void>;
}
