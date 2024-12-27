/* eslint-disable prettier/prettier */
import { inject, injectable } from '@theia/core/shared/inversify';
import { AbstractDialog } from '../../theia/dialogs/dialogs';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { ThemeService } from '@theia/core/lib/browser/theming';

@injectable()
export class KeymapsDialogProps extends DialogProps { }

@injectable()
export class KeymapsDialog extends AbstractDialog<Promise<Keymaps>> {
    private mainDiv: HTMLDivElement;

    @inject(ThemeService)
    private readonly themeService: ThemeService;

    constructor(
        @inject(KeymapsDialogProps)
        protected override readonly props: KeymapsDialogProps
    ) {
        super(props);
        this.node.id = 'lingzhi-keymaps-dialog-container';
        this.contentNode.classList.add('lingzhi-keymaps-dialog');

        this.contentNode.style.width = '100%';
        this.contentNode.style.height = '260px';

        this.initLayout();
    }

    private initLayout() {
        const topDiv = document.createElement('div');
        topDiv.className = 'lingzhi-ide-keymaps-top'
        this.contentNode.appendChild(topDiv);

        const titleDiv = document.createElement('div');
        titleDiv.style.width = '100%';
        titleDiv.style.height = '30px';
        titleDiv.style.display = 'flex';
        titleDiv.style.alignItems = 'center';
        titleDiv.style.justifyContent = 'center';
        topDiv.appendChild(titleDiv);

        const nameDiv = document.createElement('div');
        nameDiv.className = 'lingzhi-ide-keymaps-title'
        nameDiv.textContent = '功能'
        titleDiv.appendChild(nameDiv);

        const shortcutKeyDiv = document.createElement('div');
        shortcutKeyDiv.className = 'lingzhi-ide-keymaps-title'
        shortcutKeyDiv.textContent = '快捷键'
        titleDiv.appendChild(shortcutKeyDiv);

        const spring = document.createElement('div');
        spring.style.width = '10px';
        titleDiv.appendChild(spring);

        const mainDiv = document.createElement('div');
        mainDiv.className = 'lingzhi-ide-keymaps-main';
        topDiv.appendChild(mainDiv);
        this.mainDiv = mainDiv;

        const keymapsData = [
            ['撤销', 'Ctrl+Z'], ['恢复', 'Ctrl+Shift+Z'], ['剪切', 'Ctrl+X'], ['复制', 'Ctrl+C'],
            ['粘贴', 'Ctrl+V'], ['全选', 'Ctrl+A'], ['转到行/列...', 'Ctrl+L'], ['注释/取消注释', 'Ctrl+/'],
            ['自动格式化', 'Ctrl+T'], ['放大字号', 'Ctrl+='], ['缩小字号', 'Ctrl+-'], ['查找', 'Ctrl+F'],
            ['查找上一个', 'Ctrl+G'], ['查找下一个', 'Ctrl+Shift+G'], ['查找选定内容', 'Ctrl+E'],
            ['设置', 'Ctrl+逗号'], ['保存', 'Ctrl+S'], ['另存为...', 'Ctrl+Shift+S'],
            ['键盘快捷方式参考', 'Alt+Shift+逗号'], ['退出', 'Ctrl+Q'], ['串口监视器', 'Ctrl+Shift+M'],
            ['使用编程器上传', 'Ctrl+Shift+U'], ['导出以编译的二进制文件', 'Alt+Ctrl+S'], ['显示项目文件', 'Alt+Ctrl+K'],
            ['在参考文件寻找', 'Ctrl+Shift+F'], ['转到定义', 'Ctrl+F12'], ['转到编辑器的符号...', 'Ctrl+Shift+O'],
            ['查看定义', 'Alt+F12'], ['重命名符号', 'F2'], ['更改所有事件', 'Ctrl+F2'],
            ['格式化文件', 'Alt+Shift+F']
        ]

        keymapsData.forEach((raw) => {
            const keymapsRawDiv = document.createElement('div');
            keymapsRawDiv.style.width = '100%';
            keymapsRawDiv.style.height = '30px';
            keymapsRawDiv.style.display = 'flex';
            keymapsRawDiv.style.alignItems = 'center';
            keymapsRawDiv.style.justifyContent = 'center';
            keymapsRawDiv.style.backgroundColor = '#ffffff';
            mainDiv.appendChild(keymapsRawDiv);

            this.onclickKeymapsRawDiv(keymapsRawDiv);

            const keymapsNameDiv = document.createElement('div');
            keymapsNameDiv.className = 'lingzhi-ide-keymaps-raw'
            keymapsNameDiv.textContent = raw[0];
            keymapsRawDiv.appendChild(keymapsNameDiv);

            const keymapsShortcutKeyDiv = document.createElement('div');
            keymapsShortcutKeyDiv.className = 'lingzhi-ide-keymaps-raw'
            keymapsShortcutKeyDiv.textContent = raw[1];
            keymapsRawDiv.appendChild(keymapsShortcutKeyDiv);

        })
    }

    private onclickKeymapsRawDiv(keymapsRawDiv: HTMLDivElement) {
        keymapsRawDiv.addEventListener('click', () => {
            keymapsRawDiv.style.backgroundColor = '#1283dc';
            const childs = this.mainDiv.children;
            for (let i = 0; i < childs.length; i++) {
                const child = childs[i] as HTMLDivElement;
                if (child !== keymapsRawDiv) {
                    child.style.backgroundColor = '#ffffff';
                }
            }
        });
    }

    override get value(): Promise<Keymaps> {
        throw new Error('Method not implemented.');
    }

    override close(): void {
        if (this.resolve) {
            if (this.activeElement) {
                this.activeElement.focus({ preventScroll: true });
            }
            this.resolve(undefined);
        }

        const childs = this.mainDiv.children;
        for (let i = 0; i < childs.length; i++) {
            const child = childs[i] as HTMLDivElement;
            child.style.backgroundColor = '#ffffff';
        }

        this.activeElement = undefined;
        super.close();
    }

    override async open(): Promise<Promise<Keymaps> | undefined> {
        // 获取打开前主题的id
        const themeIdBeforeOpen = this.themeService.getCurrentTheme().id;
        // 调用父类open方法
        const result = await super.open();
        // 如果打开失败
        if (!result) {
            // 如果当前主题id与打开前主题id不同
            if (this.themeService.getCurrentTheme().id !== themeIdBeforeOpen) {
                // 将当前主题设置为打开前主题
                this.themeService.setCurrentTheme(themeIdBeforeOpen);
            }
        }
        // 返回结果
        return result;
    }

}

export interface Keymaps {
    path: string;
    model: string;
}
