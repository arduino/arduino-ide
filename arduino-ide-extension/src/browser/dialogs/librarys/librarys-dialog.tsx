/* eslint-disable prettier/prettier */
import { inject, injectable } from '@theia/core/shared/inversify';
import { AbstractDialog } from '../../theia/dialogs/dialogs';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { LibraryService } from '../../../common/protocol/library-service';
import { FileDialogService } from '@theia/filesystem/lib/browser/file-dialog/file-dialog-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

@injectable()
export class LibrarysDialogProps extends DialogProps { }

@injectable()
export class LibrarysDialog extends AbstractDialog<Promise<Lidrarys>> {
    private path: string;
    private model: string;
    private pathInput: HTMLInputElement;
    private result: HTMLSpanElement;

    @inject(ThemeService)
    private readonly themeService: ThemeService;
    @inject(LibraryService) private libraryService: LibraryService;
    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;
    @inject(FileService)
    protected readonly fileService: FileService;

    constructor(
        @inject(LibrarysDialogProps)
        protected override readonly props: LibrarysDialogProps
    ) {
        super(props);
        this.node.id = 'lingzhi-librarys-dialog-container';
        this.contentNode.classList.add('lingzhi-librarys-dialog');

        this.contentNode.style.width = '100%';
        this.contentNode.style.height = '160px';
        this.contentNode.style.borderTop = '1px solid #4e5b61';

        this.initLayout();
    }

    private initLayout() {
        const initDiv = document.createElement('div');
        initDiv.className = 'librarys-dialog-init';
        this.contentNode.appendChild(initDiv);

        const modelDiv = document.createElement('div');
        modelDiv.className = 'librarys-dialog-model';
        initDiv.appendChild(modelDiv);
        this.initModel(modelDiv);

        const pathDiv = document.createElement('div');
        pathDiv.className = 'librarys-dialog-path';
        initDiv.appendChild(pathDiv);
        this.initPath(pathDiv);

        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'librarys-dialog-button';
        initDiv.appendChild(buttonDiv);
        this.initButton(buttonDiv);

        const resultDiv = document.createElement('div');
        resultDiv.className = 'librarys-dialog-result';
        initDiv.appendChild(resultDiv);

        const result = document.createElement('span');
        this.result = result;
        resultDiv.appendChild(result);
    }

    private initModel(modelDiv: HTMLDivElement) {
        const modelText = document.createElement('span');
        modelText.innerText = '硬件型号：';
        modelDiv.appendChild(modelText);

        const modelSelect = document.createElement('select');
        modelSelect.className = 'librarys-dialog-model-select';
        modelDiv.appendChild(modelSelect);

        const refreshLibrarys = document.createElement('button');
        refreshLibrarys.innerText = '刷新库';
        refreshLibrarys.className = 'librarys-dialog-refresh-librarys';
        // modelDiv.appendChild(refreshLibrarys);

        refreshLibrarys.onclick = async () => {
            this.result.innerText = '';
            let data = await this.libraryService.getBoardLibraries();
            if (data.length !== 0) {
                modelSelect.innerHTML = '';
                this.modelSelect(modelSelect, data);
            }

            this.result.innerText = '刷新库成功！';
            this.result.style.color = 'green';
            this.pathInput.value = '';
        }

        this.modelSelect(modelSelect);
    }

    private async modelSelect(modelSelect: HTMLSelectElement, data: string[] = []) {
        if (data.length === 0) {
            data = ['ESP32', 'ESP8266', 'nrf52832', 'STM32F1', 'STM32HAL']
        }

        const GPLibrary = document.createElement('option');
        GPLibrary.innerText = '通用库';
        GPLibrary.value = 'GPLibrary';
        modelSelect.appendChild(GPLibrary);

        data.forEach((board) => {
            const option = document.createElement('option');
            switch (board) {
                case 'STM32F1':
                    const mini = document.createElement('option');
                    mini.innerText = '零知-标准板';
                    mini.value = board;
                    modelSelect.appendChild(mini);
                    option.innerText = '零知-迷你板';
                    break;
                case 'ESP8266':
                    option.innerText = '零知-ESP8266';
                    break;
                case 'nrf52832':
                    option.innerText = '零知-BLE52';
                    break;
                case 'ESP32':
                    option.innerText = '零知-ESP32';
                    break;
                case 'STM32HAL':
                    option.innerText = '零知-增强板';
                    break;
            }
            option.value = board;
            modelSelect.appendChild(option);
        })
        modelSelect.value = 'GPLibrary';
        this.model = modelSelect.value;
        modelSelect.addEventListener('change', () => {
            this.model = modelSelect.value;
        });
    }

    private initPath(pathDiv: HTMLDivElement) {
        const pathText = document.createElement('span');
        pathText.innerText = '文件夹路径：';
        pathDiv.appendChild(pathText);

        const pathInput = document.createElement('input');
        pathInput.className = 'librarys-dialog-path-input';
        pathInput.type = 'text';
        pathDiv.appendChild(pathInput);
        this.pathInput = pathInput;

        pathInput.addEventListener('change', () => {
            this.path = pathInput.value;
        })

        const pathButton = document.createElement('button');
        pathButton.className = 'librarys-dialog-path-button';
        pathButton.innerText = '...';

        pathDiv.appendChild(pathButton);

        pathButton.addEventListener('click', async () => {
            const uri = await this.fileDialogService.showOpenDialog({
                title: '选择本地软件库目录',
                openLabel: '选择文件夹',
                canSelectFiles: false,
                canSelectMany: false,
                canSelectFolders: true,
                modal: true,
            });

            if (uri) {
                this.path = await this.fileService.fsPath(uri);
                pathInput.value = this.path;
                this.result.innerText = '';
            } else {
                this.result.innerText = '未选择任何目录！';
                this.result.style.color = 'red';
                pathInput.value = '';
            }

        })
    }

    private initButton(buttonDiv: HTMLDivElement) {
        const installButton = document.createElement('button');
        installButton.className = 'librarys-dialog-button-button';
        installButton.innerText = '安装';
        buttonDiv.appendChild(installButton);


        const cancelButton = document.createElement('button');
        cancelButton.className = 'librarys-dialog-button-button';
        cancelButton.innerText = '退出';
        buttonDiv.appendChild(cancelButton);
        cancelButton.addEventListener('click', () => {
            this.close();
        })


        this.installLibrary(installButton);
    }

    private installLibrary(installButton: HTMLButtonElement) {
        installButton.addEventListener('click', async () => {
            const path = this.path;
            const model = this.model;
            if (!path) {
                this.result.innerText = '未选择任何目录！';
                this.result.style.color = 'red';
                return;
            }
            const result = await this.libraryService.installLibrary(path, model);
            if (result[1]) {
                this.result.innerText = result[0];
                this.result.style.color = 'green';
            } else {
                this.result.innerText = result[0];
                this.result.style.color = 'red';
            }

        })
    }

    override get value(): Promise<Lidrarys> {
        throw new Error('Method not implemented.');
    }

    override close(): void {
        if (this.resolve) {
            if (this.activeElement) {
                this.activeElement.focus({ preventScroll: true });
            }
            this.resolve(undefined);
        }
        this.pathInput.value = '';
        this.result.innerText = '';
        this.activeElement = undefined;
        super.close();
    }

    override async open(): Promise<Promise<Lidrarys> | undefined> {
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

export interface Lidrarys {
    path: string;
    model: string;
}
