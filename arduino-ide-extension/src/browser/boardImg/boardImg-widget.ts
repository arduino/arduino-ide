/* eslint-disable prettier/prettier */
import { injectable } from '@theia/core/shared/inversify';
import { BaseWidget } from '@theia/core/lib/browser/widgets/widget';
import { nls } from '@theia/core/lib/common';

@injectable()
export class BoardImgWidget extends BaseWidget {
    static readonly LABEL = nls.localize('arduino/home/boardImg', '开发板');
    // 声明一个私有成员变量用于存储滚动容器
    private scrollContainer: HTMLDivElement;

    constructor(
        // @inject(BoardsService) private readonly boardsService: BoardsService,
        // @inject(CommandService) private commandService: CommandService,
        // @inject(BoardsServiceProvider)
        // private readonly boardsServiceProvider: BoardsServiceProvider
    ) {
        super();
        this.id = 'lingzhi-boardImg-widget';
        this.title.caption = BoardImgWidget.LABEL;
        this.title.label = BoardImgWidget.LABEL;
        this.title.iconClass = 'fa lingzhi-chanpinfenlei-kaifaban';
        this.title.closable = true;
        this.node.tabIndex = 0;

        // this.selectExamples();

        // // 添加一个包含滚动条的容器元素到小部件的节点中
        // this.scrollContainer = document.createElement('div');
        // this.scrollContainer.style.overflowY = 'auto';
        // this.scrollContainer.style.display = 'flex';
        // this.scrollContainer.style.alignItems = 'center';
        // this.scrollContainer.style.justifyContent = 'center';
        // this.scrollContainer.style.height = `calc(100% - 102px)`;
        // this.scrollContainer.style.borderTop = '1px solid #dae3e3';

        // this.node.appendChild(this.scrollContainer);
        // this.officialWebsiteInformation();

        // this.imgDisplay();
    }

    // private officialWebsiteInformation() {
    //     const container1 = document.createElement('div');
    //     container1.style.display = 'flex';
    //     container1.style.alignItems = 'center';
    //     container1.style.margin = '5px 10px ';

    //     // 创建文字
    //     const name = document.createElement('span');
    //     name.textContent = '名称:';
    //     name.style.marginRight = '15px';
    //     name.style.whiteSpace = 'nowrap';

    //     const name1 = document.createElement('span');
    //     this.boardsServiceProvider.onBoardListDidChange((boardList) => {
    //         if (boardList.boardsConfig.selectedBoard?.fqbn) {
    //             const fqbn = boardList.boardsConfig.selectedBoard.fqbn;
    //             const lastColonIndex = fqbn.lastIndexOf(':');
    //             const valueAfterLastColon = fqbn.slice(lastColonIndex + 1);
    //             switch (valueAfterLastColon) {
    //                 case 'lzesp32':
    //                     name1.textContent = '零知-ESP32';
    //                     break;
    //                 case 'lzesp8266':
    //                     name1.textContent = '零知-ESP8266';
    //                     break;
    //                 case 'lingzhistandard':
    //                     name1.textContent = '零知-标准板';
    //                     break;
    //                 case 'lingzhiMini':
    //                     name1.textContent = '零知-迷你板';
    //                     break;
    //                 case 'lingzhiM4':
    //                     name1.textContent = '零知-增强板';
    //                     break;
    //                 case 'lz_ble52':
    //                     name1.textContent = '零知-BLE52';
    //                     break;
    //                 default:
    //                     if (boardList.boardsConfig.selectedBoard?.name) {
    //                         name1.textContent = boardList.boardsConfig.selectedBoard.name;
    //                     }
    //                     break;
    //             }
    //         }
    //     });
    //     name1.style.marginRight = '15px';
    //     name1.style.whiteSpace = 'nowrap';
    //     name1.style.color = '#5500ff';

    //     container1.appendChild(name);
    //     container1.appendChild(name1);
    //     this.node.appendChild(container1);

    //     const container2 = document.createElement('div');
    //     container2.style.display = 'flex';
    //     container2.style.alignItems = 'center';
    //     container2.style.margin = '5px 10px ';

    //     // 创建文字
    //     const brand = document.createElement('span');
    //     brand.textContent = '品牌:';
    //     brand.style.marginRight = '15px';

    //     const brand1 = document.createElement('span');
    //     brand1.textContent = '零知实验室';
    //     brand1.style.marginRight = '15px';
    //     brand1.style.color = '#5500ff';

    //     container2.appendChild(brand);
    //     container2.appendChild(brand1);
    //     this.node.appendChild(container2);

    //     const container3 = document.createElement('div');
    //     container3.style.display = 'flex';
    //     container3.style.alignItems = 'center';
    //     container3.style.margin = '5px 10px ';

    //     // 创建文字
    //     const officialWebsite = document.createElement('span');
    //     officialWebsite.textContent = '官网:';
    //     officialWebsite.style.marginRight = '15px';

    //     const officialWebsite1 = document.createElement('a');
    //     officialWebsite1.textContent = 'www.lingzhilab.com';
    //     officialWebsite1.style.textDecoration = 'underline';
    //     officialWebsite1.style.marginRight = '15px';
    //     officialWebsite1.style.cursor = 'pointer';
    //     officialWebsite1.style.color = '#5500ff';

    //     officialWebsite1.addEventListener('click', () => {
    //         this.commandService.executeCommand('arduino-visit-arduino');
    //     });

    //     container3.appendChild(officialWebsite);
    //     container3.appendChild(officialWebsite1);
    //     this.node.appendChild(container3);
    // }

    // // file:///D:/work/work3/arduino-ide-2.3.2/electron-app/lib/frontend/index.html?port=59791#/d:/work/work3/arduino-ide-2.3.2/arduino-ide-extension/lib/node/resources/Examples/lz-esp32/BLE(%E8%93%9D%E7%89%99)/BLE_notify(%E8%93%9D%E7%89%99%E9%80%9A%E7%9F%A5)/BLE_notify
    // private imgDisplay(imgName = '') {
    //     // 先清除之前的图片
    //     while (this.scrollContainer.firstChild) {
    //         this.scrollContainer.removeChild(this.scrollContainer.firstChild);
    //     }

    //     const img = new Image();
    //     let absolutePath = `./icon/${imgName}.svg`;
    //     if (imgName === 'lzesp8266') {
    //         absolutePath = `./icon/${imgName}.png`;
    //     }
    //     img.src = absolutePath;
    //     const resizeObserver = new ResizeObserver(() => {
    //         if (this.scrollContainer.clientWidth === 232) {
    //             img.style.width = '50%';
    //         } else {
    //             img.style.width = '100%';
    //         }
    //     });
    //     resizeObserver.observe(this.scrollContainer);

    //     img.style.margin = 'auto';
    //     img.style.position = 'relative';
    //     this.scrollContainer.appendChild(img);
    // }

    // private async selectExamples() {
    //     // 创建包含文字和下拉框的容器
    //     const container = document.createElement('div');
    //     container.style.display = 'flex';
    //     container.style.alignItems = 'center';
    //     container.style.margin = '5px 10px ';

    //     // 创建文字
    //     const label = document.createElement('span');
    //     label.textContent = '开发板:';
    //     label.style.marginRight = '15px';

    //     // 创建下拉框
    //     const dropdown = document.createElement('select');

    //     const allBoards = await this.boardsService.getInstalledBoards();


    //     this.boardsServiceProvider.onBoardListDidChange((boardList) => {
    //         dropdown.value = boardList.boardsConfig.selectedBoard?.fqbn as string;
    //         const parts = dropdown.value.split(':');
    //         const imgName = parts[parts.length - 1];
    //         this.imgDisplay(imgName);
    //     });

    //     this.boardsServiceProvider.onBoardsConfigDidChange(() => {
    //         this.boardsServiceProvider.ready.then(() => {
    //             const { selectedBoard } = this.boardsServiceProvider.boardsConfig;
    //             const name = selectedBoard?.fqbn;
    //             dropdown.value = name as string;
    //         });
    //     });

    //     allBoards.forEach((board) => {
    //         const option = document.createElement('option');
    //         const fqbn = board.fqbn as string;
    //         option.value = fqbn;
    //         const lastColonIndex = fqbn.lastIndexOf(':');
    //         const valueAfterLastColon = fqbn.slice(lastColonIndex + 1);
    //         switch (valueAfterLastColon) {
    //             case 'lzesp32':
    //                 option.textContent = '零知-ESP32';
    //                 break;
    //             case 'lzesp8266':
    //                 option.textContent = '零知-ESP8266';
    //                 break;
    //             case 'lingzhistandard':
    //                 option.textContent = '零知-标准板';
    //                 break;
    //             case 'lingzhiMini':
    //                 option.textContent = '零知-迷你板';
    //                 break;
    //             case 'lingzhiM4':
    //                 option.textContent = '零知-增强板';
    //                 break;
    //             case 'lz_ble52':
    //                 option.textContent = '零知-BLE52';
    //                 break;
    //             default:
    //                 if (board.name) {
    //                     option.textContent = board.name;
    //                 }
    //                 break;
    //         }
    //         dropdown.appendChild(option);
    //     });
    //     dropdown.style.borderColor = 'rgb(172, 172, 172)';
    //     dropdown.style.color = 'rgb(0, 0, 0)';
    //     dropdown.style.backgroundImage =
    //         'linear-gradient(to bottom, rgb(254, 254, 254) 0%, rgb(241, 241, 241) 100%)';
    //     dropdown.style.width = '125px';
    //     dropdown.addEventListener('change', () => {
    //         const commandId = `arduino-select-board--${dropdown.value}`;
    //         this.commandService
    //             .executeCommand(commandId)
    //             .then(() => {
    //                 console.log(`Executed command: ${commandId}`);
    //             })
    //             .catch((error) => {
    //                 console.error(`Failed to execute command ${commandId}: ${error}`);
    //             });
    //     });

    //     // 将文字和下拉框添加到容器中
    //     container.appendChild(label);
    //     container.appendChild(dropdown);

    //     // 将容器添加到节点中
    //     this.node.insertBefore(container, this.scrollContainer);
    // }
}
