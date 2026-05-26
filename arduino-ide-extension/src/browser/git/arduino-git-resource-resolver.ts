import { inject, injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { Resource, ResourceResolver } from '@theia/core/lib/common/resource';
import { Disposable } from '@theia/core/lib/common/disposable';
import { GitFileRef, GitService } from '../../common/protocol/git-service';

export const ArduinoGitResourceScheme = 'arduino-git';
export type ArduinoGitResourceRef =
  | GitFileRef
  | 'INDEX_EDIT'
  | 'WORKTREE_EDIT'
  | 'EMPTY';

export namespace ArduinoGitResourceUri {
  export function create(
    rootUri: string,
    fileUri: string,
    ref: ArduinoGitResourceRef
  ): URI {
    const params = new URLSearchParams();
    params.set('root', rootUri);
    params.set('file', fileUri);
    params.set('ref', ref);
    return new URI(
      `${ArduinoGitResourceScheme}:/${new URI(fileUri).path.base}`
    ).withQuery(params.toString());
  }

  export function parse(uri: URI): {
    rootUri: string;
    fileUri: string;
    ref: ArduinoGitResourceRef;
  } {
    const params = new URLSearchParams(uri.query);
    const rootUri = params.get('root');
    const fileUri = params.get('file');
    const ref = params.get('ref');
    if (
      uri.scheme !== ArduinoGitResourceScheme ||
      !rootUri ||
      !fileUri ||
      (ref !== 'HEAD' &&
        ref !== 'INDEX' &&
        ref !== 'INDEX_EDIT' &&
        ref !== 'WORKTREE_EDIT' &&
        ref !== 'EMPTY')
    ) {
      throw new Error(`Invalid Arduino Git resource URI: ${uri.toString()}`);
    }
    return {
      rootUri,
      fileUri,
      ref,
    };
  }
}

@injectable()
export class ArduinoGitResourceResolver implements ResourceResolver {
  @inject(GitService)
  private readonly gitService: GitService;

  async resolve(uri: URI): Promise<Resource> {
    const { rootUri, fileUri, ref } = ArduinoGitResourceUri.parse(uri);
    const indexEdit = ref === 'INDEX_EDIT';
    const worktreeEdit = ref === 'WORKTREE_EDIT';
    return {
      uri,
      readOnly: !(indexEdit || worktreeEdit),
      dispose: Disposable.NULL.dispose,
      readContents: async () =>
        ref === 'EMPTY' || worktreeEdit
          ? ''
          : this.gitService.show(
              rootUri,
              fileUri,
              ref === 'INDEX_EDIT' ? 'INDEX' : ref
            ),
      saveContents: indexEdit
        ? async (content) =>
            this.gitService.writeIndex(rootUri, fileUri, content)
        : worktreeEdit
        ? async (content) =>
            this.gitService.writeWorkingTree(rootUri, fileUri, content)
        : undefined,
    };
  }
}
