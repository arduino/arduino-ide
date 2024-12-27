/* eslint-disable prettier/prettier */
import { BaseWidget, Message } from '@theia/core/lib/browser';
import { CommandService } from '@theia/core/lib/common/command';
import { inject } from '@theia/core/shared/inversify';
import { MyWidgetCommandHome } from '../boardImg/boardImg-widget-contribution';
import { LibraryService } from '../../common/protocol';
import { LibInfo } from '../../node/library-service-impl';
import { LIBRARYS_OPEN } from '../dialogs/librarys/open-librarys';
import { MessageService } from '@theia/core/lib/common/message-service';

export class MyLibraryListWidget extends BaseWidget {
    private listDiv: HTMLDivElement;
    private mainRightDiv: HTMLDivElement;
    private initMessage: HTMLSpanElement;
    private boradName: string;
    private va = '';
    private stateSelectValue = 'all';
    private taskData: string | undefined;
    private libOptionsMap: Map<string, Map<number, Libver>> = new Map();

    @inject(CommandService) private commandService: CommandService;
    @inject(MessageService) private readonly messageService: MessageService;

    constructor(@inject(LibraryService) private libraryService: LibraryService,) {
        super();
        this.id = 'lingzhi-library-widget';
        this.title.caption = '库';
        this.title.label = '库';
        this.title.iconClass = 'fa lingzhi-libmager';
        this.title.closable = true;
        this.node.tabIndex = 4;

        this.initialLayout();
    }

    private initialLayout() {
        this.node.className = 'lingzhi-home p-Widget p-DockPanel-widget';

        const topLevelDiv = document.createElement('div');
        topLevelDiv.style.width = '100%';
        topLevelDiv.style.height = '100%';
        this.node.appendChild(topLevelDiv);

        const titleDiv = document.createElement('div');
        titleDiv.className = 'lingzhi-library-title'
        topLevelDiv.appendChild(titleDiv);

        const mainDiv = document.createElement('div');
        mainDiv.className = 'lingzhi-library-main'
        topLevelDiv.appendChild(mainDiv);

        this.masterScope(mainDiv);
        this.headRegion(titleDiv);

    }

    private headRegion(titleDiv: HTMLDivElement) {
        const model = document.createElement('div');
        model.className = 'lingzhi-library-title-model';
        titleDiv.appendChild(model);

        const modelText = document.createElement('span');
        modelText.innerText = '硬件型号:';
        modelText.style.whiteSpace = 'nowrap'
        model.appendChild(modelText);

        const modelSelect = document.createElement('select');
        modelSelect.className = 'lingzhi-library-title-model-select';
        model.appendChild(modelSelect);
        this.modelSelect(modelSelect);

        const search = document.createElement('div');
        search.className = 'lingzhi-library-title-search';
        const resizeObserver = new ResizeObserver(() => {
            let searchWidth = 190;
            searchWidth = titleDiv.clientWidth - 1000;
            if (searchWidth < 190) {
                searchWidth = 190;
            }
            if (searchWidth > 396) {
                searchWidth = 396;
            }
            search.style.width = `${searchWidth}px`;
        });
        resizeObserver.observe(titleDiv);
        titleDiv.appendChild(search);

        const searchText = document.createElement('span');
        searchText.innerText = '搜索:';
        searchText.style.whiteSpace = 'nowrap'
        search.appendChild(searchText);

        const searchInput = document.createElement('input');
        searchInput.className = 'lingzhi-library-title-search-input'
        searchInput.type = 'text';
        searchInput.placeholder = '输入软件库名称...';
        search.appendChild(searchInput);

        searchInput.addEventListener('input', async () => {
            this.va = searchInput.value;
            this.searchInput();
        })

        const installLocally = document.createElement('button');
        installLocally.textContent = '从本地安装'
        installLocally.className = 'lingzhi-library-title-install-locally';
        titleDiv.appendChild(installLocally);
        installLocally.addEventListener('click', () => {
            this.commandService.executeCommand(LIBRARYS_OPEN.id);
        })

        const installingLibraries = document.createElement('button');
        installingLibraries.textContent = '安装当前库';
        installingLibraries.className = 'lingzhi-library-title-install-locally';
        // titleDiv.appendChild(installingLibraries);

        const initMessage = document.createElement('span');
        initMessage.innerText = '初始化软件库信息完成！';
        initMessage.style.color = '#008000'
        initMessage.style.whiteSpace = 'nowrap'
        titleDiv.appendChild(initMessage);
        this.initMessage = initMessage;

    }

    private async searchInput(libraryData: LibInfo[] = []) {
        if (libraryData.length === 0) {
            libraryData = await this.libraryService.libraryData(this.boradName);
        }

        const searchLibraryData: LibInfo[] = [];
        libraryData.forEach((library) => {
            const values = Array.from(library.name).map((item) => item.toLowerCase());
            const searchValues = Array.from(this.va).map((item) => item.toLowerCase());
            for (let i = 0; i < values.length; i++) {
                let index = 0;
                for (let j = 0; j < searchValues.length; j++) {
                    if (values[i + j] === searchValues[j]) {
                        index++;
                    } else {
                        break;
                    }
                }
                if (index === this.va.length) {
                    searchLibraryData.push(library);
                    break;
                }
            }
        })
        this.listDiv.innerHTML = '';
        this.libraryList(searchLibraryData);
    }

    private async modelSelect(modelSelect: HTMLSelectElement) {
        const data = await this.libraryService.getBoardLibraries();
        if (data.length !== 0) {
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
            // const GPLibrary = document.createElement('option');
            // GPLibrary.innerText = '通用库';
            // GPLibrary.value = 'GPLibrary';
            // modelSelect.appendChild(GPLibrary);

            modelSelect.value = 'STM32F1';
            this.boradName = modelSelect.value;
            modelSelect.addEventListener('change', () => {
                this.boradName = modelSelect.value;
                this.searchInput();
            });
        }
        this.searchInput();
    }

    private async masterScope(mainDiv: HTMLDivElement) {
        // 创建 mainLeftDiv
        const mainLeftDiv: HTMLDivElement = document.createElement('div');
        mainLeftDiv.style.flexGrow = '1';
        mainLeftDiv.style.minWidth = '200px';
        mainLeftDiv.style.width = '200px';
        mainLeftDiv.style.height = '100%';
        mainDiv.appendChild(mainLeftDiv);

        this.listDisplay(mainLeftDiv);

        // 创建 mainRightDiv
        const mainRightDiv: HTMLDivElement = document.createElement('div');
        mainRightDiv.style.flexGrow = '1';
        mainRightDiv.style.minWidth = '200px';
        mainRightDiv.style.height = '100%';
        mainRightDiv.style.width = 'calc(100% - 200px)';
        mainRightDiv.style.display = 'flex';
        mainRightDiv.style.flexDirection = 'column';
        mainRightDiv.style.gap = '3px';
        mainDiv.appendChild(mainRightDiv);
        this.mainRightDiv = mainRightDiv;

        await this.informationDisplay({
            name: '', libvers: [{ libver: '', brief: '', url: '', isCurrentVersion: true }],
            className: '', incfile: '', libraryName: '', state: 'uninstalled',
        });

        // 创建分割线（拉框）
        const resizeBar: HTMLDivElement = document.createElement('div');
        resizeBar.style.width = '5px';
        resizeBar.style.cursor = 'ew-resize';
        mainDiv.insertBefore(resizeBar, mainRightDiv);

        // 监听鼠标拖动事件以调整宽度
        resizeBar.addEventListener('mousedown', (e: MouseEvent) => {
            const startX = e.clientX;
            const startWidth = mainLeftDiv.offsetWidth;

            document.onmousemove = (e: MouseEvent) => {
                const endX = e.clientX;
                let moveLen = startWidth + (endX - startX);
                const maxWidth = mainDiv.clientWidth - resizeBar.offsetWidth;
                if (moveLen < 200) {
                    moveLen = 200;
                }

                if (moveLen > maxWidth - 100) {
                    moveLen = maxWidth - 100;
                }

                mainLeftDiv.style.width = `${(moveLen / maxWidth) * 100}%`;
                mainRightDiv.style.width = `${((maxWidth - moveLen) / maxWidth) * 100}%`;
            }

            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
                resizeBar.releasePointerCapture(1);
            }

            resizeBar.setPointerCapture(1);
            return false;
        })
    }

    private async listDisplay(mainLeftDiv: HTMLDivElement) {
        const stateDiv = document.createElement('div');
        stateDiv.className = 'lingzhi-main-left-state'
        mainLeftDiv.appendChild(stateDiv);

        const stateText = document.createElement('span');
        stateText.innerText = '安装状态:';
        stateText.style.whiteSpace = 'nowrap';
        stateDiv.appendChild(stateText);

        const stateSelect = document.createElement('select');
        stateSelect.className = 'lingzhi-main-left-state-select';
        stateDiv.appendChild(stateSelect);
        this.stateSelect(stateSelect);

        const refreshButton = document.createElement('button');
        refreshButton.innerText = '刷新';
        refreshButton.className = 'lingzhi-main-left-state-refresh-button';
        stateDiv.appendChild(refreshButton);
        refreshButton.addEventListener('click', async () => {
            await this.refresh(true);
        });

        const listDiv = document.createElement('div');
        listDiv.className = 'lingzhi-main-left-list';
        mainLeftDiv.appendChild(listDiv);

        this.listDiv = listDiv;
    }

    private stateSelect(stateSelect: HTMLSelectElement) {
        const allOption = document.createElement('option');
        allOption.innerText = '全部';
        allOption.value = 'all';
        stateSelect.appendChild(allOption);

        const installedOption = document.createElement('option');
        installedOption.innerText = '已安装';
        installedOption.value = 'installed';
        stateSelect.appendChild(installedOption);

        const notInstalledOption = document.createElement('option');
        notInstalledOption.innerText = '未安装';
        notInstalledOption.value = 'uninstalled';
        stateSelect.appendChild(notInstalledOption);

        const canUpdateOption = document.createElement('option');
        canUpdateOption.innerText = '可更新';
        canUpdateOption.value = 'renewable';
        stateSelect.appendChild(canUpdateOption);

        stateSelect.addEventListener('change', async () => {
            const libraryData = await this.libraryService.libraryData(this.boradName);
            this.listDiv.innerHTML = '';
            this.stateSelectValue = stateSelect.value;
            const newLibraryData = this.stateJudgement(libraryData);

            if (newLibraryData.length === 0) {
                this.listDiv.innerHTML = '';
                return
            }
            if (this.va === '') {
                await this.libraryList(newLibraryData);
            } else {
                this.searchInput(newLibraryData);
            }
        })
    }

    private stateJudgement(libraryData: LibInfo[]): LibInfo[] {
        const newLibraryData = new Array<LibInfo>();
        if (this.stateSelectValue === 'all') {
            libraryData.forEach((item) => newLibraryData.push(item));
        }
        if (this.stateSelectValue === 'installed') {
            libraryData.forEach((item) =>
                (item.state === 'installed' || item.state === 'renewable') && newLibraryData.push(item));
        }
        if (this.stateSelectValue === 'uninstalled') {
            libraryData.forEach((item) => item.state === 'uninstalled' && newLibraryData.push(item));
        }
        if (this.stateSelectValue === 'renewable') {
            libraryData.forEach((item) => item.state === 'renewable' && newLibraryData.push(item));
        }

        return newLibraryData;
    }

    private async refresh(networking = false) {
        this.initMessage.innerText = '初始化软件库信息';
        this.initMessage.style.color = '#000000';

        let libraryData: LibInfo[];
        if (networking) {
            libraryData = await this.libraryService.netWorkingGetLibraryData(this.boradName);
        } else {
            libraryData = await this.libraryService.libraryData(this.boradName);
        }
        libraryData = this.stateJudgement(libraryData);
        await this.searchInput(libraryData);

        this.mainRightDiv.innerHTML = '';
        await this.informationDisplay({
            name: '', libvers: [{ libver: '', brief: '', url: '', isCurrentVersion: true }],
            className: '', incfile: '', libraryName: '', state: 'uninstalled',
        });

        setTimeout(() => {
            this.initMessage.innerText = '初始化软件库信息完成！'
            this.initMessage.style.color = '#008000';
        }, 500);
    }

    private async libraryList(libraryData: LibInfo[]) {
        libraryData.forEach((library) => {
            const libraryDiv = document.createElement('div');
            libraryDiv.className = 'lingzhi-main-left-list-library';
            this.listDiv.appendChild(libraryDiv);

            const libraryText = document.createElement('div');
            libraryText.className = 'lingzhi-main-left-list-library-text';
            libraryDiv.appendChild(libraryText);

            const libraryName = document.createElement('span');
            libraryName.innerText = `名称：${library.name}`;
            libraryName.className = 'lingzhi-main-left-list-library-name';
            libraryText.appendChild(libraryName);

            const versionDiv = document.createElement('div');
            versionDiv.className = 'lingzhi-main-left-list-library-version';
            libraryText.appendChild(versionDiv);

            const libraryVersion = document.createElement('span');
            libraryVersion.innerText = `版本:`;
            versionDiv.appendChild(libraryVersion);

            const versionSelect = document.createElement('select');
            versionSelect.className = 'lingzhi-main-left-list-library-version-select';
            versionDiv.appendChild(versionSelect);

            const installButton = document.createElement('button');
            installButton.className = 'lingzhi-main-left-list-library-version-install';

            this.creatOptionAndInstallButton(library, versionSelect, installButton, versionDiv, libraryDiv)

            const libraryState = document.createElement('div');
            libraryState.className = 'lingzhi-main-left-list-library-state';
            libraryDiv.appendChild(libraryState);

            const state = document.createElement('div');
            state.style.width = '10px';
            state.style.height = '10px';
            state.style.borderRadius = '50%';
            if (library.state === 'installed') {
                state.style.border = '1px solid #00ff00';
                state.style.backgroundColor = '#00ff00';
            } else if (library.state === 'uninstalled') {
                state.style.border = '1px solid #a0a0a4';
                state.style.backgroundColor = '#ffffff';
            } else if (library.state === 'renewable') {
                state.style.border = '1px solid #ea9849';
                state.style.backgroundColor = '#ea9849';
            }
            state.style.marginBottom = '14px';
            libraryState.appendChild(state);

            this.libraryDivOnClick(libraryDiv, library);
        })
    }

    private creatOptionAndInstallButton(
        library: LibInfo,
        versionSelect: HTMLSelectElement,
        installButton: HTMLButtonElement,
        versionDiv: HTMLDivElement,
        libraryDiv: HTMLDivElement
    ) {
        versionSelect.addEventListener('click', (event) => {
            event.stopPropagation();
        })
        versionSelect.addEventListener('dblclick', (event) => {
            event.stopPropagation();
        })

        let index = 0;
        let currentVersionValue = -1;
        let isinstalled = false;
        let currentVersion: string;
        const map = new Map<number, Libver>();
        library.libvers.forEach((lib) => {
            const array = new Libver();
            const versionOption = document.createElement('option');
            versionOption.value = `${index}`;
            versionOption.innerText = `${lib.libver}`;
            versionSelect.appendChild(versionOption);
            if (lib.isCurrentVersion) {
                versionSelect.value = `${index}`;
                currentVersionValue = index;
                isinstalled = true;
                currentVersion = lib.libver;
            }
            array.libver = lib.libver;
            array.isSelected = false;
            array.url = lib.url;
            array.name = library.name;
            map.set(index, array);
            index++;
        })
        this.libOptionsMap.set(library.name, map);

        if (!isinstalled) {
            versionDiv.appendChild(installButton);
            installButton.innerText = '安装';
            this.downloadLibraryFile(installButton, map.get(0) as Libver);
        }

        let valueIndex: number;
        versionSelect.addEventListener('change', async () => {
            this.libOptionsMap.forEach(async (libValue, key) => {
                if (key === library.name) {
                    let nowVewsion = '';
                    libValue.forEach((value, key) => {
                        if (key === parseInt(versionSelect.value, 10)) {
                            valueIndex = key;
                            value.isSelected = true
                            libValue.set(key, value);
                            nowVewsion = value.libver;
                            this.downloadLibraryFile(installButton, value);
                        } else {
                            value.isSelected = false;
                            libValue.set(key, value);
                        }
                    });
                    if (currentVersionValue === -1) {
                        return;
                    }
                    const isNewVrsion = await this.libraryService.compareVersions(nowVewsion, currentVersion) > 0
                    if (isNewVrsion) {
                        installButton.innerText = '更新';
                    } else {
                        installButton.innerText = '安装';
                    }
                    if (currentVersionValue !== valueIndex) {
                        if (versionDiv.children[2]) {
                            versionDiv.removeChild(versionDiv.children[2]);
                        }
                        versionDiv.appendChild(installButton);
                    } else {
                        versionDiv.removeChild(installButton);
                    }
                }
            });

            const doubleClickEvent = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true
            });
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true
            });
            if (libraryDiv) {
                libraryDiv.dispatchEvent(doubleClickEvent);
                libraryDiv.dispatchEvent(clickEvent);
            }
        })
    }

    private async downloadLibraryFile(installButton: HTMLButtonElement, value: Libver) {
        const downloadUrl = value.url;
        const fileName = downloadUrl.split('/').pop() as string;
        const savePath = `AppData\\Local\\Lingzhi\\staging\\libraries\\${fileName}`;
        const extractDir =
            `AppData\\Local\\Lingzhi\\packages\\lingzhi\\hardware\\${this.boradName}\\libraries`;
        const libraryService = this.libraryService;
        installButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            let fa = true;
            if (this.taskData) {
                fa = false;
            } else {
                this.taskData = value.name;
            }

            if (fa) {
                installButton.style.backgroundColor = 'rgba(29, 190, 249, 0.7)';
                installButton.style.borderColor = 'rgba(29, 190, 249, 0.7)';
                const success = await libraryService.installationLibrary(downloadUrl, savePath, extractDir);
                if (success) {
                    fa = true;
                    this.taskData = undefined;
                    await this.refresh();
                    installButton.style.backgroundColor = '#1dbef9';
                    installButton.style.borderColor = '#1dbef9';
                }
            }
        });
        installButton.addEventListener('dblclick', (event) => {
            event.stopPropagation();
        })
    }

    private libraryDivOnClick(libraryDiv: HTMLDivElement, library: LibInfo) {
        libraryDiv.addEventListener('click', () => {
            const libraryDivChildren = libraryDiv.children;
            for (let i = 0; i < libraryDivChildren.length; i++) {
                const children = libraryDivChildren[i] as HTMLDivElement;
                children.style.backgroundColor = '#d0d0d0';
            }

            const allChildren = this.listDiv.children;
            for (let i = 0; i < allChildren.length; i++) {
                if (allChildren[i] !== libraryDiv) {
                    const children = allChildren[i].children;
                    for (let j = 0; j < children.length; j++) {
                        const child = children[j] as HTMLDivElement;
                        child.style.backgroundColor = '#ffffff';
                    }
                }
            }
        });
        libraryDiv.addEventListener('dblclick', async () => {
            this.mainRightDiv.innerHTML = '';
            const manual = await this.libraryService.manualData(this.boradName, library.libraryName);
            let selectIndex = 0
            this.libOptionsMap.get(library.name)?.forEach((value, key) => {
                if (value.isSelected) {
                    selectIndex = key;
                }
            });
            await this.informationDisplay(library, manual, selectIndex);

        })
    }

    private async informationDisplay(library: LibInfo, manual = '', selectIndex = 0) {
        const headerInformation = document.createElement('div');
        headerInformation.className = 'lingzhi-main-left-information-header';
        this.mainRightDiv.appendChild(headerInformation);

        const headerInformationName = [
            `名称:${library.name}`, `当前版本:${library.libvers[selectIndex].libver}`,
            `最新版本:${library.libvers[0].libver}`, `类名:${library.className}`, `头文件:${library.incfile}`, '简要描述:'
        ];

        headerInformationName.forEach((name) => {
            const headerInformationNameDiv = document.createElement('div');
            headerInformationNameDiv.className = 'lingzhi-main-left-information-header-name';
            headerInformation.appendChild(headerInformationNameDiv);

            const leftName = document.createElement('span');
            leftName.innerText = name;
            leftName.style.textAlign = 'justify';
            leftName.style.textAlignLast = 'justify';
            leftName.style.whiteSpace = 'nowrap';
            leftName.style.userSelect = 'none';
            headerInformationNameDiv.appendChild(leftName);
        })

        const contentDescribe = document.createElement('div');
        contentDescribe.innerText = `${library.libvers[selectIndex].brief}`;
        contentDescribe.style.overflowY = 'auto';
        contentDescribe.style.overflowX = 'hidden';
        contentDescribe.className = 'lingzhi-main-left-information-content-describe';
        this.mainRightDiv.appendChild(contentDescribe);

        const detailedHeard = document.createElement('span');
        detailedHeard.innerText = '详细说明(仅在库安装后显示):';
        detailedHeard.style.whiteSpace = 'nowrap';
        detailedHeard.style.width = 'calc(100% - 10px)';
        detailedHeard.style.height = '20px';
        detailedHeard.style.marginLeft = '10px'
        detailedHeard.style.userSelect = 'none';
        this.mainRightDiv.appendChild(detailedHeard);

        const detailedContent = document.createElement('div');
        detailedContent.className = 'lingzhi-main-left-information-content-detailed';
        if (manual !== '') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(manual, 'text/html');
            const elements = doc.querySelectorAll('a');
            elements.forEach((element: HTMLElement) => {
                element.removeAttribute('href');
                element.style.textDecoration = 'underline';
            });
            const body = doc.body;
            while (body.firstChild) {
                detailedContent.appendChild(body.firstChild);
            }
        }
        this.mainRightDiv.appendChild(detailedContent);
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.commandService.executeCommand(MyWidgetCommandHome.id);
    }
}

export class Libver {
    name: string;
    libver: string;
    isSelected: boolean;
    url: string;
}
