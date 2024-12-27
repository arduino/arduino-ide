/* eslint-disable prettier/prettier */
import { codicon, Message } from '@theia/core/lib/browser';
import { KeybindingWidget } from '@theia/keymaps/lib/browser/keybindings-widget';

export class KeymapsFrontendWidget extends KeybindingWidget {
    constructor() {
        super();
    }

    protected override init(): void {
        super.init();
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.innerHTML = '';
        this.id = KeybindingWidget.ID;
        this.title.label = '键盘快捷方式参考';
        this.title.caption = '键盘快捷方式参考';
        this.title.iconClass = codicon('three-bars');
        this.title.closable = true;

        this.node.style.height = 'calc(100% - 32px)';
        this.node.style.width = '100%';
        this.titleDiv();
    }

    private titleDiv() {
        const topDiv = document.createElement('div');
        topDiv.className = 'lingzhi-ide-keymaps-top'
        this.node.appendChild(topDiv);

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
            mainDiv.appendChild(keymapsRawDiv);

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


}
