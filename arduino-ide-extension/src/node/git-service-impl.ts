import { inject, injectable } from '@theia/core/shared/inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { FileUri } from '@theia/core/lib/common/file-uri';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  GitService,
  GitStatus,
  GitBranch,
  GitFileChange,
  GitFileRef,
  GitFileStatus,
  GitCommit,
  GitRemote,
  GitSyncResult,
} from '../common/protocol/git-service';

@injectable()
export class GitServiceImpl implements GitService {
  @inject(ILogger)
  protected readonly logger: ILogger;

  async isGitRepo(dirUri: string): Promise<boolean> {
    const dir = path.resolve(FileUri.fsPath(dirUri));
    try {
      const topLevel = await this.exec(dir, ['rev-parse', '--show-toplevel']);
      return this.samePath(topLevel, dir);
    } catch {
      return false;
    }
  }

  async init(dirUri: string): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    await this.exec(dir, ['init']);
  }

  async status(dirUri: string): Promise<GitStatus> {
    const dir = FileUri.fsPath(dirUri);

    const branch = await this.currentBranch(dir);

    // Get remote tracking branch
    let remoteBranch: string | undefined;
    try {
      remoteBranch = await this.exec(dir, [
        'rev-parse',
        '--abbrev-ref',
        '--symbolic-full-name',
        '@{u}',
      ]);
    } catch {
      // no upstream set
    }

    // Get ahead/behind counts
    let ahead = 0;
    let behind = 0;
    if (remoteBranch) {
      try {
        const ab = await this.exec(dir, [
          'rev-list',
          '--left-right',
          '--count',
          `${remoteBranch}...HEAD`,
        ]);
        const parts = ab.split('\t');
        behind = parseInt(parts[0], 10) || 0;
        ahead = parseInt(parts[1], 10) || 0;
      } catch {
        // ignore
      }
    }

    // Parse file statuses using --porcelain format
    // Format: XY PATH or XY ORIG -> PATH
    // X = staged status, Y = unstaged status
    const staged: GitFileChange[] = [];
    const unstaged: GitFileChange[] = [];
    const untracked: GitFileChange[] = [];

    try {
      const statusOut = await this.exec(
        dir,
        [
          'status',
          '--porcelain',
          '-u',
          '-z', // NUL-separated for safe parsing of paths with spaces
        ],
        { trim: false }
      );

      if (statusOut) {
        // -z format: each entry is NUL terminated. Rename/copy records include
        // a second NUL-terminated old path after the destination path.
        const entries = statusOut.split('\0');
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          if (!entry) {
            continue;
          }
          const x = entry[0]; // staged status
          const y = entry[1]; // unstaged status
          const filePart = entry.slice(3); // after "XY "

          const relativePath = filePart;
          const absPath = path.join(dir, relativePath);
          const fileUri = FileUri.create(absPath).toString();

          if (x === '?' && y === '?') {
            untracked.push({
              uri: fileUri,
              relativePath,
              status: '?',
            });
          } else if (this.isUnmergedStatus(x, y)) {
            unstaged.push({
              uri: fileUri,
              relativePath,
              status: 'U',
            });
          } else {
            // Staged (index) status
            if (x !== ' ' && x !== '?') {
              staged.push({
                uri: fileUri,
                relativePath,
                status: this.mapStatus(x),
              });
            }
            // Unstaged (worktree) status
            if (y !== ' ' && y !== '?') {
              unstaged.push({
                uri: fileUri,
                relativePath,
                status: this.mapStatus(y),
              });
            }
          }

          if (x === 'R' || x === 'C' || y === 'R' || y === 'C') {
            i++;
          }
        }
      }
    } catch {
      // no commits yet or not a git repo - return empty
    }

    return { branch, remoteBranch, ahead, behind, staged, unstaged, untracked };
  }

  async branches(dirUri: string): Promise<GitBranch[]> {
    const dir = FileUri.fsPath(dirUri);
    const current = await this.currentBranch(dir);
    const output = await this.exec(
      dir,
      [
        'for-each-ref',
        '--sort=refname',
        '--format=%(refname:short)%09%(upstream:short)',
        'refs/heads',
      ],
      { trim: false }
    );

    return output
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [name, upstream] = line.split('\t');
        return {
          name,
          current: name === current,
          upstream: upstream || undefined,
        };
      });
  }

  async checkout(dirUri: string, branchName: string): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    await this.exec(dir, ['checkout', branchName]);
  }

  async createBranch(
    dirUri: string,
    branchName: string,
    checkout: boolean
  ): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    await this.exec(dir, ['check-ref-format', '--branch', branchName]);
    await this.exec(
      dir,
      checkout ? ['checkout', '-b', branchName] : ['branch', branchName]
    );
  }

  async stage(dirUri: string, files: string[]): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    const pathspecs = this.toPathspecs(dir, files);
    await this.exec(dir, ['add', '--', ...pathspecs]);
  }

  async unstage(dirUri: string, files: string[]): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    const pathspecs = this.toPathspecs(dir, files);
    // 'git restore --staged' requires git 2.23+, use reset HEAD as fallback safe option
    try {
      await this.exec(dir, ['restore', '--staged', '--', ...pathspecs]);
    } catch {
      await this.exec(dir, ['reset', 'HEAD', '--', ...pathspecs]);
    }
  }

  async discard(dirUri: string, files: string[]): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    const pathspecs = this.toPathspecs(dir, files);
    const status = await this.status(dirUri);

    if (pathspecs.includes('.')) {
      if (status.unstaged.length) {
        await this.exec(dir, ['restore', '--', ...pathspecs]);
      }
      return;
    }

    const unstaged = new Set(
      status.unstaged.map((change) => change.relativePath)
    );
    const trackedPathspecs = pathspecs.filter((pathspec) =>
      unstaged.has(pathspec)
    );

    if (trackedPathspecs.length) {
      await this.exec(dir, ['restore', '--', ...trackedPathspecs]);
    }
  }

  async clean(dirUri: string, files: string[]): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    const pathspecs = this.toPathspecs(dir, files);
    const status = await this.status(dirUri);

    if (pathspecs.includes('.')) {
      if (status.untracked.length) {
        await this.exec(dir, ['clean', '-fd', '--', ...pathspecs]);
      }
      return;
    }

    const untracked = new Set(
      status.untracked.map((change) =>
        this.normalizeGitPath(change.relativePath)
      )
    );
    const untrackedPathspecs = pathspecs.filter((pathspec) =>
      untracked.has(this.normalizeGitPath(pathspec))
    );

    if (untrackedPathspecs.length) {
      await this.exec(dir, ['clean', '-fd', '--', ...untrackedPathspecs]);
    }
  }

  async commit(dirUri: string, message: string): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    await this.exec(dir, ['commit', '-m', message]);
  }

  async pull(dirUri: string): Promise<GitSyncResult> {
    const dir = FileUri.fsPath(dirUri);
    try {
      const output = await this.exec(dir, ['pull', '--ff-only']);
      return { success: true, message: output };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  async push(dirUri: string): Promise<GitSyncResult> {
    const dir = FileUri.fsPath(dirUri);
    try {
      const output = await this.exec(dir, ['push']);
      return { success: true, message: output };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  async publish(dirUri: string, remoteName: string): Promise<GitSyncResult> {
    const dir = FileUri.fsPath(dirUri);
    try {
      const branch = await this.currentBranch(dir);
      if (!branch || branch === 'HEAD') {
        return {
          success: false,
          message: 'Cannot publish a detached HEAD.',
        };
      }
      const output = await this.exec(dir, ['push', '-u', remoteName, branch]);
      return { success: true, message: output };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message };
    }
  }

  async remotes(dirUri: string): Promise<GitRemote[]> {
    const dir = FileUri.fsPath(dirUri);
    try {
      const output = await this.exec(dir, ['remote', '-v']);
      if (!output) {
        return [];
      }
      const remotes = new Map<string, GitRemote>();
      for (const line of output.split('\n')) {
        const match = line.match(/^(\S+)\s+(.+)\s+\((fetch|push)\)$/);
        if (!match) {
          continue;
        }
        const [, name, url, type] = match;
        const current = remotes.get(name) ?? { name };
        remotes.set(
          name,
          type === 'fetch'
            ? { ...current, fetchUrl: url }
            : { ...current, pushUrl: url }
        );
      }
      return [...remotes.values()];
    } catch {
      return [];
    }
  }

  async addRemote(dirUri: string, name: string, url: string): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    await this.exec(dir, ['remote', 'add', name, url]);
  }

  async setRemoteUrl(dirUri: string, name: string, url: string): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    await this.exec(dir, ['remote', 'set-url', name, url]);
  }

  async diff(
    dirUri: string,
    fileUri: string,
    staged: boolean
  ): Promise<string> {
    const dir = FileUri.fsPath(dirUri);
    const file = this.toGitRelativePath(dir, fileUri);
    const args = ['diff', '--', file];
    if (staged) {
      args.splice(1, 0, '--staged');
    }
    try {
      return await this.exec(dir, args);
    } catch {
      return '';
    }
  }

  async show(
    dirUri: string,
    fileUri: string,
    ref: GitFileRef
  ): Promise<string> {
    const dir = FileUri.fsPath(dirUri);
    const relativePath = this.toGitRelativePath(dir, fileUri);
    const treeish = ref === 'INDEX' ? '' : 'HEAD';
    try {
      return await this.exec(dir, ['show', `${treeish}:${relativePath}`], {
        trim: false,
      });
    } catch {
      return '';
    }
  }

  async writeIndex(
    dirUri: string,
    fileUri: string,
    content: string
  ): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    const relativePath = this.toGitRelativePath(dir, fileUri);
    const hasHeadVersion = await this.hasRevisionFile(
      dir,
      relativePath,
      'HEAD'
    );
    const headContent = hasHeadVersion
      ? await this.show(dirUri, fileUri, 'HEAD')
      : undefined;

    if (headContent === content) {
      await this.unstage(dirUri, [fileUri]);
      return;
    }

    if (!hasHeadVersion && !content) {
      await this.exec(dir, [
        'rm',
        '--cached',
        '--ignore-unmatch',
        '--',
        relativePath,
      ]);
      return;
    }

    const mode = await this.indexMode(dir, relativePath);
    const hash = await this.exec(dir, ['hash-object', '-w', '--stdin'], {
      input: content,
    });
    await this.exec(dir, [
      'update-index',
      '--add',
      '--cacheinfo',
      `${mode},${hash},${relativePath}`,
    ]);
  }

  async writeWorkingTree(
    dirUri: string,
    fileUri: string,
    content: string
  ): Promise<void> {
    const dir = FileUri.fsPath(dirUri);
    const relativePath = this.toGitRelativePath(dir, fileUri);
    const fsPath = path.join(dir, relativePath);
    await fs.mkdir(path.dirname(fsPath), { recursive: true });
    await fs.writeFile(fsPath, content, 'utf8');
  }

  async log(dirUri: string, maxEntries = 20): Promise<GitCommit[]> {
    const dir = FileUri.fsPath(dirUri);
    const format = '%H%n%h%n%s%n%an%n%ar';
    try {
      const out = await this.exec(dir, [
        'log',
        `--max-count=${maxEntries}`,
        `--format=${format}`,
        '--',
      ]);
      if (!out) return [];

      const commits: GitCommit[] = [];
      const lines = out.split('\n');
      // Each commit produces 5 lines from the format
      for (let i = 0; i + 4 < lines.length; i += 5) {
        commits.push({
          hash: lines[i].trim(),
          shortHash: lines[i + 1].trim(),
          message: lines[i + 2].trim(),
          author: lines[i + 3].trim(),
          date: lines[i + 4].trim(),
        });
      }
      return commits;
    } catch {
      return [];
    }
  }

  private mapStatus(code: string): GitFileStatus {
    switch (code) {
      case 'M':
        return 'M';
      case 'A':
        return 'A';
      case 'D':
        return 'D';
      case 'R':
        return 'R';
      case 'C':
        return 'C';
      case 'U':
        return 'U';
      default:
        return 'M';
    }
  }

  private isUnmergedStatus(x: string, y: string): boolean {
    return (
      x === 'U' ||
      y === 'U' ||
      (x === 'A' && y === 'A') ||
      (x === 'D' && y === 'D')
    );
  }

  private async currentBranch(dir: string): Promise<string> {
    try {
      const branch = await this.exec(dir, ['branch', '--show-current']);
      if (branch) {
        return branch;
      }
    } catch {
      // fall back below
    }
    try {
      return await this.exec(dir, ['symbolic-ref', '--short', 'HEAD']);
    } catch {
      return 'HEAD';
    }
  }

  private async indexMode(dir: string, relativePath: string): Promise<string> {
    try {
      const entry = await this.exec(dir, [
        'ls-files',
        '-s',
        '--',
        relativePath,
      ]);
      const match = entry.match(/^(\d+)\s+[0-9a-f]+\s+\d+\t/);
      if (match) {
        return match[1];
      }
    } catch {
      // use regular file mode below
    }
    return '100644';
  }

  private async hasRevisionFile(
    dir: string,
    relativePath: string,
    revision: string
  ): Promise<boolean> {
    try {
      await this.exec(dir, ['cat-file', '-e', `${revision}:${relativePath}`]);
      return true;
    } catch {
      return false;
    }
  }

  private toPathspecs(repoDir: string, files: string[]): string[] {
    if (!files.length) {
      return ['.'];
    }
    return files.map((file) => {
      if (file === '.' || file === '') {
        return '.';
      }
      return this.toGitRelativePath(repoDir, file);
    });
  }

  private toGitRelativePath(repoDir: string, fileUriOrPath: string): string {
    const fsPath = this.toFsPath(repoDir, fileUriOrPath);
    const relativePath = path.relative(repoDir, fsPath);
    if (!relativePath) {
      return '.';
    }
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error(`Path is outside the Git repository: ${fsPath}`);
    }
    return relativePath.split(path.sep).join(path.posix.sep);
  }

  private normalizeGitPath(relativePath: string): string {
    return relativePath.replace(/\/+$/, '');
  }

  private toFsPath(repoDir: string, fileUriOrPath: string): string {
    if (fileUriOrPath.startsWith('file:')) {
      return FileUri.fsPath(fileUriOrPath);
    }
    if (path.isAbsolute(fileUriOrPath)) {
      return fileUriOrPath;
    }
    return path.resolve(repoDir, fileUriOrPath);
  }

  private samePath(left: string, right: string): boolean {
    const normalizedLeft = path.normalize(path.resolve(left));
    const normalizedRight = path.normalize(path.resolve(right));
    return process.platform === 'win32'
      ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
      : normalizedLeft === normalizedRight;
  }

  /**
   * Spawn a git command and return stdout as a trimmed string.
   * Rejects with stderr content on non-zero exit code.
   */
  private exec(
    cwd: string,
    args: string[],
    options: { trim?: boolean; input?: string } = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.logger.debug(`git ${args.join(' ')} (cwd: ${cwd})`);
      const proc = spawn('git', args, {
        cwd,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      });
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
      proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
      if (options.input !== undefined) {
        proc.stdin.end(options.input);
      } else {
        proc.stdin.end();
      }
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(options.trim === false ? stdout : stdout.trim());
        } else {
          reject(new Error(stderr.trim() || `git exited with code ${code}`));
        }
      });
      proc.on('error', (err) => reject(err));
    });
  }
}
