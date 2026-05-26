export const GitServicePath = '/services/git-service';
export const GitService = Symbol('GitService');

export interface GitService {
  /**
   * Check if the given directory is itself a git repository root.
   */
  isGitRepo(dirUri: string): Promise<boolean>;

  /**
   * Initialize a new git repository in the given directory.
   */
  init(dirUri: string): Promise<void>;

  /**
   * Get the current git status of the sketch directory.
   */
  status(dirUri: string): Promise<GitStatus>;

  /**
   * List local branches.
   */
  branches(dirUri: string): Promise<GitBranch[]>;

  /**
   * Checkout an existing branch.
   */
  checkout(dirUri: string, branchName: string, remote?: boolean): Promise<void>;

  /**
   * Create a branch, optionally checking it out immediately.
   */
  createBranch(
    dirUri: string,
    branchName: string,
    checkout: boolean
  ): Promise<void>;

  /**
   * Stage one or more files.
   */
  stage(dirUri: string, files: string[]): Promise<void>;

  /**
   * Unstage one or more files.
   */
  unstage(dirUri: string, files: string[]): Promise<void>;

  /**
   * Discard tracked unstaged changes.
   */
  discard(dirUri: string, files: string[]): Promise<void>;

  /**
   * Delete matching untracked files.
   */
  clean(dirUri: string, files: string[]): Promise<void>;

  /**
   * Commit staged changes with the given message.
   */
  commit(dirUri: string, message: string): Promise<void>;

  /**
   * Pull from the remote.
   */
  pull(dirUri: string): Promise<GitSyncResult>;

  /**
   * Fetch from remotes.
   */
  fetch(dirUri: string, remoteName?: string): Promise<GitSyncResult>;

  /**
   * Push to the remote.
   */
  push(dirUri: string): Promise<GitSyncResult>;

  /**
   * Push current branch and set upstream on the remote.
   */
  publish(dirUri: string, remoteName: string): Promise<GitSyncResult>;

  /**
   * List configured Git remotes.
   */
  remotes(dirUri: string): Promise<GitRemote[]>;

  /**
   * Add a remote.
   */
  addRemote(dirUri: string, name: string, url: string): Promise<void>;

  /**
   * Update an existing remote URL.
   */
  setRemoteUrl(dirUri: string, name: string, url: string): Promise<void>;

  /**
   * Get unified diff for a file.
   */
  diff(dirUri: string, fileUri: string, staged: boolean): Promise<string>;

  /**
   * Read a file from a git revision.
   */
  show(dirUri: string, fileUri: string, ref: GitFileRef): Promise<string>;

  /**
   * Rewrite a file in the Git index.
   */
  writeIndex(dirUri: string, fileUri: string, content: string): Promise<void>;

  /**
   * Rewrite a file in the working tree.
   */
  writeWorkingTree(
    dirUri: string,
    fileUri: string,
    content: string
  ): Promise<void>;

  /**
   * Get recent commit log.
   */
  log(dirUri: string, maxEntries?: number): Promise<GitCommit[]>;
}

export interface GitStatus {
  readonly branch: string;
  readonly remoteBranch?: string;
  readonly ahead: number;
  readonly behind: number;
  readonly staged: GitFileChange[];
  readonly unstaged: GitFileChange[];
  readonly untracked: GitFileChange[];
}

export interface GitBranch {
  readonly name: string;
  readonly current: boolean;
  readonly remote?: boolean;
  readonly upstream?: string;
}

export interface GitFileChange {
  readonly uri: string; // absolute fs path
  readonly relativePath: string; // relative to repo root
  readonly status: GitFileStatus;
}

export type GitFileStatus = 'M' | 'A' | 'D' | 'R' | 'C' | 'U' | '?';

export type GitFileRef = 'HEAD' | 'INDEX';

export namespace GitFileStatus {
  export function toLabel(status: GitFileStatus): string {
    switch (status) {
      case 'M':
        return 'Modified';
      case 'A':
        return 'Added';
      case 'D':
        return 'Deleted';
      case 'R':
        return 'Renamed';
      case 'C':
        return 'Copied';
      case 'U':
        return 'Conflicting';
      case '?':
        return 'Untracked';
    }
  }

  export function toLetter(status: GitFileStatus): string {
    return status === '?' ? 'U' : status;
  }
}

export interface GitCommit {
  readonly hash: string;
  readonly shortHash: string;
  readonly message: string;
  readonly author: string;
  readonly date: string;
}

export interface GitSyncResult {
  readonly success: boolean;
  readonly message: string;
}

export interface GitRemote {
  readonly name: string;
  readonly fetchUrl?: string;
  readonly pushUrl?: string;
}
