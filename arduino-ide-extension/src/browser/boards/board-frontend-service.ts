import { injectable, inject } from "inversify";
import { BoardsService, Board } from "../../common/protocol/boards-service";

@injectable()
export class BoardFrontendService {
    @inject(BoardsService) protected readonly boardService: BoardsService;

    protected attachedBoards: Board[];

    async getAttachedBoards(): Promise<Board[]> {
        if (this.attachedBoards) {
            return this.attachedBoards;
        }
        await this.refreshAttachedBoards();
        return this.attachedBoards;
    }

    async refreshAttachedBoards(): Promise<void> {
        const { boards } = await this.boardService.getAttachedBoards();
        this.attachedBoards = boards;
    }
}