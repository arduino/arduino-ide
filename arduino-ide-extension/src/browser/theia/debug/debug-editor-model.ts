import debounce from 'p-debounce';
import { inject, injectable, postConstruct, interfaces, Container } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { Disposable, DisposableCollection } from '@theia/core/lib/common/disposable';
import { MonacoConfigurationService } from '@theia/monaco/lib/browser/monaco-frontend-module';
import { INLINE_VALUE_DECORATION_KEY } from '@theia/debug/lib/browser/editor//debug-inline-value-decorator';
import { DebugEditor } from '@theia/debug/lib/browser/editor/debug-editor';
import { DebugExceptionWidget } from '@theia/debug/lib/browser/editor/debug-exception-widget';
import { DebugBreakpointWidget } from '@theia/debug/lib/browser/editor/debug-breakpoint-widget';
import { DebugEditorModel as TheiaDebugEditorModel } from '@theia/debug/lib/browser/editor/debug-editor-model';
import { createDebugHoverWidgetContainer } from './debug-hover-widget'

// TODO: Remove after https://github.com/eclipse-theia/theia/pull/9256/
@injectable()
export class DebugEditorModel extends TheiaDebugEditorModel {

    static createContainer(parent: interfaces.Container, editor: DebugEditor): Container {
        const child = createDebugHoverWidgetContainer(parent, editor);
        child.bind(DebugEditorModel).toSelf();
        child.bind(DebugBreakpointWidget).toSelf();
        child.bind(DebugExceptionWidget).toSelf();
        return child;
    }

    static createModel(parent: interfaces.Container, editor: DebugEditor): DebugEditorModel {
        return DebugEditorModel.createContainer(parent, editor).get(DebugEditorModel);
    }

    @inject(MonacoConfigurationService)
    readonly configurationService: monaco.services.IConfigurationService;

    protected readonly toDisposeOnRenderFrames = new DisposableCollection();

    @postConstruct()
    protected init(): void {
        this.toDispose.push(this.toDisposeOnRenderFrames);
        super.init();
    }

    protected async updateEditorHover(): Promise<void> {
        if (this.isCurrentEditorFrame(this.uri)) {
            const codeEditor = this.editor.getControl();
            codeEditor.updateOptions({ hover: { enabled: false } });
            this.toDisposeOnRenderFrames.push(Disposable.create(() => {
                const model = codeEditor.getModel()!;
                const overrides = {
                    resource: model.uri,
                    overrideIdentifier: (model as any).getLanguageIdentifier().language,
                };
                const { enabled, delay, sticky } = this.configurationService._configuration.getValue('editor.hover', overrides, undefined);
                codeEditor.updateOptions({
                    hover: {
                        enabled,
                        delay,
                        sticky
                    }
                });
            }));
        }
    }

    private isCurrentEditorFrame(uri: URI): boolean {
        return this.sessions.currentFrame?.source?.uri.toString() === uri.toString();
    }

    protected readonly renderFrames = debounce(async () => {
        if (this.toDispose.disposed) {
            return;
        }
        this.toDisposeOnRenderFrames.dispose();

        this.toggleExceptionWidget();
        const [newFrameDecorations, inlineValueDecorations] = await Promise.all([
            this.createFrameDecorations(),
            this.createInlineValueDecorations()
        ]);
        const codeEditor = this.editor.getControl();
        codeEditor.removeDecorations(INLINE_VALUE_DECORATION_KEY);
        codeEditor.setDecorations(INLINE_VALUE_DECORATION_KEY, inlineValueDecorations);
        this.frameDecorations = this.deltaDecorations(this.frameDecorations, newFrameDecorations);
        this.updateEditorHover();
    }, 100);

}
