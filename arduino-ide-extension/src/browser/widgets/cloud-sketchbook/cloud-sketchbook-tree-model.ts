import { inject, injectable, postConstruct } from 'inversify';
import { TreeNode } from '@theia/core/lib/browser/tree';
import { toPosixPath, posixSegments, posix } from '../../create/create-paths';
import { CreateApi, Create } from '../../create/create-api';
import { CloudSketchbookTree } from './cloud-sketchbook-tree';
import { AuthenticationClientService } from '../../auth/authentication-client-service';
import {
    LocalCacheFsProvider,
    LocalCacheUri,
} from '../../local-cache/local-cache-fs-provider';
import { CommandRegistry } from '@theia/core/lib/common/command';
import { SketchbookTreeModel } from '../sketchbook/sketchbook-tree-model';
import { ArduinoPreferences } from '../../arduino-preferences';
import { ConfigService } from '../../../common/protocol';

export type CreateCache = Record<string, Create.Resource>;
export namespace CreateCache {
    export function build(resources: Create.Resource[]): CreateCache {
        const treeData: CreateCache = {};
        treeData[posix.sep] = CloudSketchbookTree.rootResource;
        for (const resource of resources) {
            const { path } = resource;
            const posixPath = toPosixPath(path);
            if (treeData[posixPath] !== undefined) {
                throw new Error(
                    `Already visited resource for path: ${posixPath}.\nData: ${JSON.stringify(
                        treeData,
                        null,
                        2
                    )}`
                );
            }
            treeData[posixPath] = resource;
        }
        return treeData;
    }

    export function childrenOf(
        resource: Create.Resource,
        cache: CreateCache
    ): Create.Resource[] | undefined {
        if (resource.type === 'file') {
            return undefined;
        }
        const posixPath = toPosixPath(resource.path);
        const childSegmentCount = posixSegments(posixPath).length + 1;
        return Object.keys(cache)
            .filter(
                (key) =>
                    key.startsWith(posixPath) &&
                    posixSegments(key).length === childSegmentCount
            )
            .map((childPosixPath) => cache[childPosixPath]);
    }
}

@injectable()
export class CloudSketchbookTreeModel extends SketchbookTreeModel {
    @inject(AuthenticationClientService)
    protected readonly authenticationService: AuthenticationClientService;

    @inject(ConfigService)
    protected readonly configService: ConfigService;

    @inject(CreateApi)
    protected readonly createApi: CreateApi;

    @inject(CloudSketchbookTree)
    protected readonly cloudSketchbookTree: CloudSketchbookTree;

    @inject(LocalCacheFsProvider)
    protected readonly localCacheFsProvider: LocalCacheFsProvider;

    @inject(CommandRegistry)
    public readonly commandRegistry: CommandRegistry;

    @inject(ArduinoPreferences)
    protected readonly arduinoPreferences: ArduinoPreferences;

    @postConstruct()
    protected init(): void {
        super.init();
        this.toDispose.push(
            this.authenticationService.onSessionDidChange(() =>
                this.updateRoot()
            )
        );
    }

    async updateRoot(): Promise<void> {
        const { session } = this.authenticationService;
        if (!session) {
            this.tree.root = undefined;
            return;
        }
        this.createApi.init(
            this.authenticationService,
            this.arduinoPreferences
        );

        const resources = await this.createApi.readDirectory(posix.sep, {
            recursive: true,
            secrets: true,
        });

        const cache = CreateCache.build(resources);

        // also read local files
        for await (const path of Object.keys(cache)) {
            if (cache[path].type === 'sketch') {
                const localUri = LocalCacheUri.root.resolve(path);
                const exists = await this.fileService.exists(localUri);
                if (exists) {
                    const fileStat = await this.fileService.resolve(localUri);
                    // add every missing file
                    fileStat.children
                        ?.filter(
                            (child) =>
                                !Object.keys(cache).includes(
                                    path + posix.sep + child.name
                                )
                        )
                        .forEach((child) => {
                            const localChild: Create.Resource = {
                                modified_at: '',
                                href: cache[path].href + posix.sep + child.name,
                                mimetype: '',
                                name: child.name,
                                path: cache[path].path + posix.sep + child.name,
                                sketchId: '',
                                type: child.isFile ? 'file' : 'folder',
                            };
                            cache[path + posix.sep + child.name] = localChild;
                        });
                }
            }
        }

        const showAllFiles =
            this.arduinoPreferences['arduino.sketchbook.showAllFiles'];
        this.tree.root = CloudSketchbookTree.CloudRootNode.create(
            cache,
            showAllFiles
        );
    }

    sketchbookTree(): CloudSketchbookTree {
        return this.tree as CloudSketchbookTree;
    }

    protected recursivelyFindSketchRoot(node: TreeNode): any {
        if (node && CloudSketchbookTree.CloudSketchDirNode.is(node)) {
            if (node.hasOwnProperty('underlying')) {
                return { ...node, uri: node.underlying };
            }
            return node;
        }

        if (node && node.parent) {
            return this.recursivelyFindSketchRoot(node.parent);
        }

        // can't find a root, return false
        return false;
    }
}
