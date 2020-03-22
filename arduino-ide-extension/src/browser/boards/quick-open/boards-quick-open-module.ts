import { ContainerModule } from 'inversify';
import { ILogger } from '@theia/core/lib/common/logger';
import { CommandContribution } from '@theia/core/lib/common/command';
import { QuickOpenContribution } from '@theia/core/lib/browser/quick-open';
import { KeybindingContribution } from '@theia/core/lib/browser/keybinding';
import { BoardsQuickOpenService } from './boards-quick-open-service';

export default new ContainerModule(bind => {
    bind(BoardsQuickOpenService).toSelf().inSingletonScope();
    bind(CommandContribution).toService(BoardsQuickOpenService);
    bind(KeybindingContribution).toService(BoardsQuickOpenService);
    bind(QuickOpenContribution).toService(BoardsQuickOpenService);
    bind(ILogger).toDynamicValue(({ container }) => container.get<ILogger>(ILogger).child('boards-quick-open'))
        .inSingletonScope()
        .whenTargetNamed('boards-quick-open');
});
