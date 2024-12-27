/* eslint-disable prettier/prettier */
import { CommandService, MessageService } from '@theia/core';
import { BaseWidget, LocalStorageService, Message } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import {
    ExamplesService,
    SketchContainer,
    SketchRef,
} from '../../common/protocol';
import { ArduinoMenus } from '../menu/arduino-menus';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { HomeCommands } from './home-commands';
import { FirstStartupInstaller } from '../contributions/first-startup-installer';
import { MyWidgetCommandHome } from '../boardImg/boardImg-widget-contribution';

@injectable()
export class HomeWidget extends BaseWidget {
    static readonly LABEL = '主页';
    // 声明一个私有成员变量用于存储滚动容器
    private scrollContainer: HTMLDivElement;
    private rightHeaderL: HTMLDivElement;
    private rightHeaderR: HTMLDivElement;
    private leftHeader: HTMLDivElement;
    private leftBottomL: HTMLDivElement;

    private originalBackgroundColor = 'rgb(240, 240, 240)';
    private clickedBackgroundColor = 'rgb(235, 246, 255)';
    private va = '';
    private theCurrentBoard = 'lz-standard';
    private initialJudgment = false;
    private judgingClicks: Map<string, boolean>;
    private labelsMap: Map<string, boolean>;
    private fqbn = 'lingzhi:STM32F1:lingzhistandard';

    constructor(
        @inject(ExamplesService) private examplesService: ExamplesService,
        @inject(CommandService) private commandService: CommandService,
        @inject(WindowService) protected readonly windowService: WindowService,
        @inject(LocalStorageService) private readonly localStorageService: LocalStorageService,
        @inject(MessageService) protected readonly messageService: MessageService
    ) {
        super();
        this.id = 'lingzhi-home-widget';
        this.title.caption = HomeWidget.LABEL;
        this.title.label = HomeWidget.LABEL;
        this.title.iconClass = 'fa lingzhi-upload-home';
        this.title.closable = true;
        this.node.tabIndex = 0;

        this.interface();

        this.selectExamples();
        this.searchExamples();
        this.openAWebsiteButtn();

        this.newSketchButton();
        this.openproButton();
    }

    private async interface() {
        this.node.style.display = 'flex';
        this.node.style.alignItems = 'center';
        this.node.className = 'lingzhi-home p-Widget';

        // 左界面
        const leftInterface = document.createElement('div');
        leftInterface.className = 'lingzhi-leftInterface';
        leftInterface.style.display = 'flex';
        leftInterface.style.flexDirection = 'column';
        leftInterface.style.width = '50%';
        leftInterface.style.height = '100%';
        leftInterface.style.backgroundColor = this.originalBackgroundColor;
        this.node.appendChild(leftInterface);

        // 左界面头部
        this.leftHeader = document.createElement('div');
        this.leftHeader.style.display = 'flex';
        this.leftHeader.style.alignItems = 'center';
        leftInterface.appendChild(this.leftHeader);

        // 左界面中部弹簧
        const leftMiddle = document.createElement('div');
        leftMiddle.style.height = 'calc(100% - 235px)';
        leftMiddle.style.width = '100%';
        leftInterface.appendChild(leftMiddle);

        // 左界面底部
        const leftBottom = document.createElement('div');
        leftBottom.style.display = 'flex';
        leftBottom.style.alignItems = 'center';
        leftBottom.style.width = '100%';
        leftBottom.style.height = '190px';
        leftInterface.appendChild(leftBottom);

        // 左界面底部左部
        this.leftBottomL = document.createElement('div');
        this.leftBottomL.style.display = 'flex';
        this.leftBottomL.style.flexDirection = 'column';
        this.leftBottomL.style.alignItems = 'center';
        this.leftBottomL.style.width = '125px';
        this.leftBottomL.style.height = '100%';
        this.leftBottomL.style.marginBottom = '20px';
        leftBottom.appendChild(this.leftBottomL);

        // 右界面
        const rightInterface = document.createElement('div');
        rightInterface.style.width = '50%';
        rightInterface.style.height = '100%';
        rightInterface.style.backgroundColor = this.originalBackgroundColor;
        rightInterface.style.borderLeft = '1px solid #a0a0a0';

        this.node.appendChild(rightInterface);

        // 右界面头部
        const rightHeader = document.createElement('div');
        rightHeader.style.display = 'flex';
        rightHeader.style.justifyContent = 'flex-start';
        rightHeader.style.alignItems = 'center';
        rightHeader.style.width = '100%';
        rightHeader.style.height = '30px';
        rightInterface.appendChild(rightHeader);

        // 右界面头部左部
        this.rightHeaderL = document.createElement('div');
        this.rightHeaderL.style.display = 'flex';
        this.rightHeaderL.style.justifyContent = 'flex-start';
        this.rightHeaderL.style.alignItems = 'center';
        this.rightHeaderL.style.width = '125px';
        this.rightHeaderL.style.marginLeft = '20px';
        rightHeader.appendChild(this.rightHeaderL);

        // 右界面头部右部
        this.rightHeaderR = document.createElement('div');
        this.rightHeaderR.style.display = 'flex';
        this.rightHeaderR.style.justifyContent = 'flex-end';
        this.rightHeaderR.style.alignItems = 'center';
        this.rightHeaderR.style.width = 'calc(100% - 125px)';
        this.rightHeaderR.style.margin = '0 10px 0 5px';
        rightHeader.appendChild(this.rightHeaderR);

        // 添加一个包含滚动条的容器元素到小部件的节点中
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.style.overflowY = 'auto';
        // 设置高度为小部件的高度减去一个固定值，以适应面板
        this.scrollContainer.style.height = `calc(100% - 30px)`;
        rightInterface.appendChild(this.scrollContainer);
    }

    private convertingBoardName(fqbn: string): string {
        const parts = fqbn.split(':');
        const selectName = parts[parts.length - 1];
        let theCurrentBoard = 'lz-standard';
        switch (selectName) {
            case 'lzesp8266':
                theCurrentBoard = 'lz-esp8266';
                break;
            case 'lingzhistandard':
                theCurrentBoard = 'lz-standard';
                break;
            case 'lingzhiMini':
                theCurrentBoard = 'lz-mini';
                break;
            case 'lingzhiM4':
                theCurrentBoard = 'lz-enhance';
                break;
            case 'lz_ble52':
                theCurrentBoard = 'lz-ble52';
                break;
            case 'lzesp32':
                theCurrentBoard = 'lz-esp32';
                break;
        }

        return theCurrentBoard;
    }

    protected override onActivateRequest(message: Message): void {
        super.onActivateRequest(message);
        this.commandService.executeCommand(HomeCommands.OPEN_HOME.id);
        this.commandService.executeCommand(MyWidgetCommandHome.id);
    }

    private async selectExamples() {
        if (!localStorage.getItem('lingzhi-board-fqbn')) {
            localStorage.setItem('lingzhi-board-fqbn', 'lingzhi:STM32F1:lingzhistandard');
        } else {
            this.fqbn = localStorage.getItem('lingzhi-board-fqbn') as string;
        }
        // 创建下拉框
        const sketchContainers = await this.examplesService.builtIns();

        const dropdown = document.createElement('select');
        const labelMap = new Map<string, boolean>();
        sketchContainers.forEach((container) => {
            const label = container.label;
            if (label !== 'public') {
                const option = document.createElement('option');
                option.value = label;
                switch (label) {
                    case 'lz-ble52':
                        option.textContent = '零知-BLE52';
                        break;
                    case 'lz-enhance':
                        option.textContent = '零知-增强板';
                        break;
                    case 'lz-esp32':
                        option.textContent = '零知-ESP32';
                        break;
                    case 'lz-esp8266':
                        option.textContent = '零知-ESP8266';
                        break;
                    case 'lz-mini':
                        option.textContent = '零知-迷你板';
                        break;
                    case 'lz-standard':
                        option.textContent = '零知-标准板';
                        break;
                }
                dropdown.appendChild(option);
                labelMap.set(label, true);
            }
        });
        this.judgingClicks = labelMap;

        dropdown.selectedIndex = 0;
        dropdown.style.borderColor = 'rgb(172, 172, 172)';
        dropdown.style.color = 'rgb(0, 0, 0)';
        dropdown.style.backgroundColor = 'rgb(246, 246, 246)';
        dropdown.style.width = '125px';
        dropdown.style.height = '23.6px';
        dropdown.style.borderRadius = '3px';
        dropdown.value = this.convertingBoardName(this.fqbn);
        dropdown.addEventListener('change', () => {
            const selectedValue = dropdown.value;
            this.judgingClicks.set(this.theCurrentBoard, true);
            this.theCurrentBoard = selectedValue;
            switch (selectedValue) {
                case 'lz-ble52':
                    this.fqbn = 'lingzhi:nrf52832:lz_ble52';
                    break;
                case 'lz-enhance':
                    this.fqbn = 'lingzhi:STM32HAL:lingzhiM4';
                    break;
                case 'lz-esp32':
                    this.fqbn = 'lingzhi:ESP32:lzesp32';
                    break;
                case 'lz-esp8266':
                    this.fqbn = 'lingzhi:ESP8266:lzesp8266';
                    break;
                case 'lz-mini':
                    this.fqbn = 'lingzhi:STM32F1:lingzhiMini'
                    break;
                case 'lz-standard':
                    this.fqbn = 'lingzhi:STM32F1:lingzhistandard';
                    break;
            }
            this.scrollContainer.innerHTML = '';
            this.fetchAndDisplayExamples(selectedValue);
        });

        // 将容器添加到节点中
        this.rightHeaderL.appendChild(dropdown);

        // 默认展示 fetchAndDisplayExamples 方法
        this.fetchAndDisplayExamples();
    }

    private async searchExamples() {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '输入查找示例...';
        searchInput.style.width = '100%';
        searchInput.style.height = '20px';
        searchInput.style.border = '1px solid rgb(172, 172, 172)';
        searchInput.style.color = 'rgb(127, 127, 127)';
        searchInput.style.backgroundColor = 'rgb(255, 255, 255)';
        searchInput.style.fontSize = '13px';
        searchInput.style.borderRadius = '3px';

        // 为输入框添加输入事件监听器
        searchInput.addEventListener('input', () => {
            this.va = searchInput.value;
            this.judgingClicks.set(this.theCurrentBoard, true);
            this.fetchAndDisplayExamples(this.theCurrentBoard);
        });

        this.rightHeaderR.appendChild(searchInput);
    }

    private openAWebsiteButtn() {
        const names = ['官方商城', '技术支持', '零知文档', '零知教程']
        const icons = ['./icon/shopping.png', './icon/techsupport.png', './icon/lzdoc.png', './icon/course.png'];
        const urls = ['http://www.lingzhilab.com/', 'http://www.lingzhilab.com/lzbbs/resources.html?ecid=206',
            'http://www.lingzhilab.com/content.html', 'http://www.lingzhilab.com/freesources.html'];
        for (let i = 0; i < 4; i++) {
            const button = document.createElement('button');
            this.buttonGenericConfiguration(button);

            button.addEventListener('click', () => {
                this.windowService.openNewWindow(urls[i], {
                    external: true,
                });
            })
            const icon = document.createElement('img');
            icon.src = icons[i];
            icon.style.width = '25px';
            icon.style.height = '25px';
            icon.style.marginRight = '5px';
            button.appendChild(icon);
            const text = document.createElement('span');
            text.innerText = names[i];
            text.style.fontWeight = 'normal';
            button.appendChild(text);
            this.leftBottomL.appendChild(button);
        }
    }

    private async openproButton() {
        // 创建按钮
        const button = document.createElement('button');
        this.buttonGenericConfiguration(button);

        button.addEventListener('click', async () => {
            const isFirstStartup = !(await this.localStorageService.getData(
                FirstStartupInstaller.INIT_LIBS_AND_PACKAGES
            ));
            if (!isFirstStartup) {
                this.commandService.executeCommand('lingzhi-open-sketch');
            } else {
                this.messageService.info(
                    '请先等待零知库下载安装完成',
                    { timeout: 3000 }
                );
            }
        });

        // 创建图标元素
        const icon = document.createElement('img');
        icon.src = './icon/openpro.png';
        icon.style.width = '25px';
        icon.style.height = '25px';
        icon.style.marginRight = '5px';

        button.appendChild(icon);
        const text = document.createElement('span');
        text.innerText = '打开项目';
        text.style.fontWeight = 'normal';

        button.appendChild(text);

        this.leftHeader.appendChild(button);
    }

    private async newSketchButton() {
        // 创建按钮
        const button = document.createElement('button');
        this.buttonGenericConfiguration(button);

        button.addEventListener('click', async () => {
            this.commandService.executeCommand('lingzhi-new-sketch');
        });

        // 创建图标元素
        const icon = document.createElement('img');
        icon.src = './icon/newpro.png';
        icon.style.width = '25px';
        icon.style.height = '25px';
        icon.style.marginRight = '5px';

        button.appendChild(icon);

        button.appendChild(icon);
        const text = document.createElement('span');
        text.innerText = '新建项目';
        text.style.fontWeight = 'normal';
        button.appendChild(text);

        this.leftHeader.appendChild(button);
    }

    private buttonGenericConfiguration(button: HTMLButtonElement) {
        button.style.height = '35px';
        button.style.width = '110px';
        button.style.backgroundColor = 'rgb(240, 240, 240)';
        button.style.border = '2px solid rgb(240, 240, 240)';
        button.style.fontWeight = 'bold';
        button.style.color = 'rgb(0, 0, 0)'; // 设置字体颜色
        button.style.borderRadius = '5px'; // 设置边框弧度
        button.style.marginLeft = '30px';
        button.style.marginTop = '10px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.whiteSpace = 'nowrap';
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgb(251, 251, 251)';
            button.style.border = '2px solid rgb(172, 172, 172)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'rgb(240, 240, 240)';
            button.style.border = '2px solid rgb(240, 240, 240)';
        });
    }

    private filteringExample(
        sketchContainersOne: SketchContainer[]
    ): SketchContainer[] {
        const sketchContainers: SketchContainer[] = [];
        const compareValues = (B: string): boolean => {
            const values = Array.from(this.va).map((item) => item.toLowerCase());
            const bs = Array.from(B).map((item) => item.toLowerCase());
            if (values.length > bs.length) {
                return false;
            }
            let judgingExistence = false;
            for (let i = 0; i <= bs.length - values.length; i++) {
                let index = 0;
                for (let j = 0; j < values.length; j++) {
                    if (bs[i + j] === values[j]) {
                        index++;
                    } else {
                        index = 0;
                        break;
                    }
                }
                if (index === values.length) judgingExistence = true;
            }
            if (judgingExistence) return true;
            return false;
        };
        sketchContainersOne.forEach((container) => {
            // let judge = true;
            // judge = compareValues(container.label); //需要搜索文件夹再打开

            let sketchContainerChildren: SketchContainer[] = [];
            if (container.children.length !== 0) {
                sketchContainerChildren = this.filteringExample(container.children);
            }
            let judgeChildren = false;
            if (sketchContainerChildren.length !== 0) judgeChildren = true;

            const sketchContainerSketches: SketchRef[] = [];
            let judgeSketches = false;
            container.sketches.forEach((container) => {
                let judgeSketche = true;
                judgeSketche = compareValues(container.name);
                if (judgeSketche) {
                    judgeSketches = true;
                    sketchContainerSketches.push(container);
                }
            });

            if (judgeSketches || judgeChildren) {
                const sketchContainerTwo: SketchContainer = {
                    label: container.label,
                    children: sketchContainerChildren,
                    sketches: sketchContainerSketches,
                };
                sketchContainers.push(sketchContainerTwo);
            }
        });
        return sketchContainers;
    }

    private async fetchAndDisplayExamples(label = '') {
        if (label === '') {
            label = this.convertingBoardName(localStorage.getItem('lingzhi-board-fqbn') as string);
        }
        try {
            let sketchContainers = await this.examplesService.builtIns();
            if (this.va === '') {
                if (this.initialJudgment) this.scrollContainer.innerHTML = '';
            } else if (this.va !== '') {
                this.scrollContainer.innerHTML = '';
                this.initialJudgment = true;
                const newSketchContainers: SketchContainer[] = [];
                sketchContainers.forEach((container) => {
                    if (container.label === 'public' || container.label === label) {
                        newSketchContainers.push(container);
                    }
                })
                sketchContainers = this.filteringExample(newSketchContainers);
            }

            if (sketchContainers) {
                if (this.judgingClicks.get(label)) {
                    this.judgingClicks.set(label, false);
                    const map = new Map();
                    forEachMap(sketchContainers);
                    function forEachMap(container: SketchContainer[]) {
                        container.forEach((childContainer) => {
                            if (
                                childContainer.label === label ||
                                childContainer.label === 'public'
                            ) {
                                forEachMap(childContainer.children);
                            } else {
                                map.set(childContainer.label, true);
                                if (childContainer.children.length !== 0) {
                                    forEachMap(childContainer.children);
                                }
                            }
                        });
                    }
                    this.labelsMap = map;
                }

                sketchContainers.forEach((container) => {
                    if (container.label === 'public' || container.label === label) {
                        container.children.forEach((childContainer) => {
                            const mainButton = document.createElement('button');
                            mainButton.style.border = 'none';
                            mainButton.style.width = '100%';
                            mainButton.style.backgroundColor = 'rgb(240, 240, 240)';
                            mainButton.style.paddingLeft = '20px';
                            mainButton.style.textAlign = 'left';
                            mainButton.style.color = 'rgb(0, 0, 0)';
                            mainButton.style.cursor = 'pointer'; // 设置鼠标悬停时为小手样式
                            mainButton.style.display = 'flex';
                            mainButton.style.alignItems = 'center';

                            this.scrollContainer.appendChild(mainButton);
                            this.createButtons(childContainer, mainButton, container.label);
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Could not fetch built-in examples.', error);
        }
    }

    private async triggerCommand(
        containerLabel: string,
        parentContainer: SketchContainer,
        i: number,
        label: string
    ) {
        const combinedArray = [
            ArduinoMenus.EXAMPLES__BUILT_IN_GROUP,
            ArduinoMenus.EXAMPLES__USER_LIBS_GROUP,
        ];

        // 触发命令
        let commandId = '';
        if (containerLabel === '') {
            commandId = `arduino-open-example-${combinedArray[0].join(
                ':'
            )}:${label}:${parentContainer.label}--${parentContainer.sketches[i - parentContainer.children.length].uri
                }`;
        } else {
            commandId = `arduino-open-example-${combinedArray[0].join(
                ':'
            )}:${label}:${containerLabel}:${parentContainer.label}--${parentContainer.sketches[i - parentContainer.children.length].uri
                }`;
        }
        this.commandService.executeCommand(`arduino-select-board--${this.fqbn}`)
        localStorage.setItem('lingzhi-board-fqbn', this.fqbn);

        const isFirstStartup = !(await this.localStorageService.getData(
            FirstStartupInstaller.INIT_LIBS_AND_PACKAGES
        ));
        if (!isFirstStartup) {
            this.commandService.executeCommand(commandId);
            this.localStorageService.setData('lingzhi-is-open', true);
            let uri = parentContainer.sketches[i - parentContainer.children.length].uri;
            const index = uri.lastIndexOf('/');
            const result = uri.substring(index + 1) + ".ino";
            uri = uri + '/' + result;

        } else {
            this.messageService.info(
                '请先等待零知库下载安装完成',
                { timeout: 3000 }
            );
        }
    }

    private createButtons(
        parentContainer: SketchContainer,
        parentButton: HTMLButtonElement,
        label: string,
        parentContainerDiv?: HTMLDivElement,
        containerLabel = ''
    ) {
        const directionIcon = document.createElement('i');
        directionIcon.style.marginRight = '5px';

        const updateDirectionIcon = (a: boolean) => {
            if (a) {
                directionIcon.classList.remove('fa', 'lingzhi-below');
                directionIcon.classList.add('fa', 'lingzhi-right');
            } else {
                directionIcon.classList.remove('fa', 'lingzhi-right');
                directionIcon.classList.add('fa', 'lingzhi-below');
            }
        };

        directionIcon.addEventListener('click', () => {
            const doubleClickEvent = new MouseEvent('dblclick', {
                bubbles: true,
                cancelable: true,
            });
            parentButton.dispatchEvent(doubleClickEvent);
        });

        parentButton.appendChild(directionIcon);

        const icon = document.createElement('img');
        if (label === 'public') {
            icon.src = './icon/example_propub.png';
        } else {
            icon.src = './icon/example_pro.png';
        }
        icon.style.width = '15px';
        icon.style.height = '15px';
        parentButton.appendChild(icon);
        parentButton.appendChild(
            document.createTextNode(` ${parentContainer.label}`)
        );
        parentButton.style.whiteSpace = 'nowrap';

        this.buttonColor(parentButton);

        let buttonRows: HTMLDivElement[] = [];

        if (this.va !== '' && this.labelsMap.get(parentContainer.label)) {
            parentButton.addEventListener('dblclick', () => {
                this.labelsMap.set(parentContainer.label, false);
                this.fetchAndDisplayExamples(label);
            });
            updateDirectionIcon(false);

            if (buttonRows.length > 0) {
                buttonRows.forEach((row) => row.remove());
                buttonRows = [];
            } else {
                // 计算按钮数量
                const totalButtons =
                    parentContainer.children.length + parentContainer.sketches.length;

                // 创建按钮并设置文本
                for (let i = 0; i < totalButtons; i++) {
                    const buttonRow = document.createElement('div');
                    const button = document.createElement('button');
                    if (i >= parentContainer.children.length) {
                        button.textContent =
                            parentContainer.sketches[
                                i - parentContainer.children.length
                            ].name;
                        button.addEventListener('dblclick', () => {
                            this.triggerCommand(containerLabel, parentContainer, i, label);
                        });
                    }
                    button.style.border = 'none';
                    button.style.width = '100%';
                    button.style.backgroundColor = this.originalBackgroundColor;
                    if (containerLabel === '') {
                        button.style.paddingLeft = '55px';
                    } else {
                        button.style.paddingLeft = '75px';
                    }

                    button.style.textAlign = 'left';
                    button.style.color = 'rgb(0, 0, 0)';
                    button.style.cursor = 'pointer'; // 设置鼠标悬停时为小手样式
                    button.style.whiteSpace = 'nowrap';
                    button.style.display = 'flex';
                    button.style.alignItems = 'center';
                    buttonRow.appendChild(button);

                    this.buttonColor(button);

                    // 如果有子节点，递归调用创建子按钮
                    if (
                        parentContainer.children[i] &&
                        (parentContainer.children[i].children.length > 0 ||
                            parentContainer.children[i].sketches.length > 0)
                    ) {
                        // 传递当前按钮行的 div 作为新的父容器 div
                        this.createButtons(
                            parentContainer.children[i],
                            button,
                            label,
                            buttonRow,
                            parentContainer.label
                        );
                    }

                    // 将子按钮插入到所点击的父按钮之后
                    if (parentContainerDiv) {
                        parentContainerDiv.appendChild(buttonRow);
                    } else {
                        this.scrollContainer.insertBefore(
                            buttonRow,
                            parentButton.nextSibling
                        );
                    }
                    buttonRows.push(buttonRow);
                }
            }
        } else {
            let fa = true;
            updateDirectionIcon(fa);
            parentButton.addEventListener('dblclick', () => {
                fa = !fa;
                updateDirectionIcon(fa);

                if (buttonRows.length > 0) {
                    buttonRows.forEach((row) => row.remove());
                    buttonRows = [];
                } else {
                    // 计算按钮数量
                    const totalButtons =
                        parentContainer.children.length + parentContainer.sketches.length;

                    // 创建按钮并设置文本
                    for (let i = 0; i < totalButtons; i++) {
                        const buttonRow = document.createElement('div');
                        const button = document.createElement('button');
                        if (i >= parentContainer.children.length) {
                            button.textContent =
                                parentContainer.sketches[
                                    i - parentContainer.children.length
                                ].name;
                            button.addEventListener('dblclick', () => {
                                this.triggerCommand(containerLabel, parentContainer, i, label);
                            });
                        }
                        button.style.border = 'none';
                        button.style.width = '100%';
                        button.style.backgroundColor = this.originalBackgroundColor;
                        if (containerLabel === '') {
                            button.style.paddingLeft = '55px';
                        } else {
                            button.style.paddingLeft = '75px';
                        }

                        button.style.textAlign = 'left';
                        button.style.color = 'rgb(0, 0, 0)';
                        button.style.cursor = 'pointer'; // 设置鼠标悬停时为小手样式
                        button.style.whiteSpace = 'nowrap';
                        button.style.display = 'flex';
                        button.style.alignItems = 'center';
                        buttonRow.appendChild(button);

                        this.buttonColor(button);

                        // 如果有子节点，递归调用创建子按钮
                        if (
                            parentContainer.children[i] &&
                            (parentContainer.children[i].children.length > 0 ||
                                parentContainer.children[i].sketches.length > 0)
                        ) {
                            // 传递当前按钮行的 div 作为新的父容器 div
                            this.createButtons(
                                parentContainer.children[i],
                                button,
                                label,
                                buttonRow,
                                parentContainer.label
                            );
                        }

                        // 将子按钮插入到所点击的父按钮之后
                        if (parentContainerDiv) {
                            parentContainerDiv.appendChild(buttonRow);
                        } else {
                            this.scrollContainer.insertBefore(
                                buttonRow,
                                parentButton.nextSibling
                            );
                        }
                        buttonRows.push(buttonRow);
                    }
                }
            });
        }
    }

    private buttonColor(button: HTMLButtonElement) {
        button.addEventListener('mouseover', () => {
            if (button.style.backgroundColor === this.originalBackgroundColor) {
                button.style.backgroundColor = 'rgb(240, 240, 240)';
                button.style.borderColor = '1px solid rgb(240, 240, 240)';
            }
        });
        button.addEventListener('mouseout', () => {
            if (button.style.backgroundColor !== this.clickedBackgroundColor) {
                button.style.backgroundColor = this.originalBackgroundColor;
                button.style.borderColor = '1px solid rgb(240, 240, 240)';
            }
        });
        button.addEventListener('click', () => {
            button.style.backgroundColor = this.clickedBackgroundColor;
            button.style.borderColor = '1px solid rgb(184, 217, 242)';

            // 清除其他主按钮的点击颜色
            const allMainButtons = document.querySelectorAll('button');
            allMainButtons.forEach((b) => {
                if (b !== button) {
                    b.style.backgroundColor = this.originalBackgroundColor;
                }
            });
        });
    }


}
