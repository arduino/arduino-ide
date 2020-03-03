import { inject, injectable } from 'inversify';
import { QuickOpenItem, QuickOpenModel } from '@theia/core/lib/common/quick-open-model';
import { QuickOpenService, QuickOpenOptions } from '@theia/core/lib/browser/quick-open/quick-open-service';
import { BoardsService, BoardsServiceClient } from '../../common/protocol';

@injectable()
export class BoardsConfigQuickOpenService {

    @inject(QuickOpenService)
    protected readonly quickOpenService: QuickOpenService;

    @inject(BoardsService)
    protected readonly boardsService: BoardsService;

    @inject(BoardsServiceClient)
    protected readonly boardsServiceClient: BoardsServiceClient;

    async selectBoard(): Promise<void> {

    }

    protected open(items: QuickOpenItem | QuickOpenItem[], placeholder: string): void {
        this.quickOpenService.open(this.getModel(Array.isArray(items) ? items : [items]), this.getOptions(placeholder));
    }

    protected getOptions(placeholder: string, fuzzyMatchLabel: boolean = true, onClose: (canceled: boolean) => void = () => { }): QuickOpenOptions {
        return QuickOpenOptions.resolve({
            placeholder,
            fuzzyMatchLabel,
            fuzzySort: false,
            onClose
        });
    }

    protected getModel(items: QuickOpenItem | QuickOpenItem[]): QuickOpenModel {
        return {
            onType(_: string, acceptor: (items: QuickOpenItem[]) => void): void {
                acceptor(Array.isArray(items) ? items : [items]);
            }
        };
    }

}
