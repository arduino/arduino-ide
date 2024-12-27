import {
  contextBridge,
  ipcRenderer,
} from '@theia/core/electron-shared/electron';
import { Disposable } from '@theia/core/lib/common/disposable';
import {
  CHANNEL_REQUEST_RELOAD,
  MenuDto,
} from '@theia/core/lib/electron-common/electron-api';
import { UUID } from '@theia/core/shared/@phosphor/coreutils';
import type { Sketch } from '../common/protocol/sketches-service';
import {
  CHANNEL_APP_INFO,
  CHANNEL_IS_FIRST_WINDOW,
  CHANNEL_MAIN_MENU_ITEM_DID_CLICK,
  CHANNEL_OPEN_PATH,
  CHANNEL_PLOTTER_WINDOW_DID_CLOSE,
  CHANNEL_QUIT_APP,
  CHANNEL_SCHEDULE_DELETION,
  CHANNEL_SEND_STARTUP_TASKS,
  CHANNEL_SET_MENU_WITH_NODE_ID,
  CHANNEL_SET_REPRESENTED_FILENAME,
  CHANNEL_SHOW_MESSAGE_BOX,
  CHANNEL_SHOW_OPEN_DIALOG,
  CHANNEL_SHOW_PLOTTER_WINDOW,
  CHANNEL_SHOW_SAVE_DIALOG,
  ElectronArduino,
  InternalMenuDto,
  LINGZHI_MAX,
  LINGZHI_MINI,
  MessageBoxOptions,
  OpenDialogOptions,
  SaveDialogOptions,
} from '../electron-common/electron-arduino';
import { hasStartupTasks, StartupTasks } from '../electron-common/startup-task';

let mainMenuHandlers: Map<string, () => void> = new Map();

function convertMenu(
  menu: MenuDto[] | undefined,
  handlerMap: Map<string, () => void>
): InternalMenuDto[] | undefined {
  if (!menu) {
    return undefined;
  }

  return menu.map((item) => {
    let nodeId = UUID.uuid4();
    if (item.execute) {
      if (!item.id) {
        throw new Error(
          "A menu item having the 'execute' property must have an 'id' too."
        );
      }
      nodeId = item.id;
      handlerMap.set(nodeId, item.execute);
    }

    return {
      id: item.id,
      submenu: convertMenu(item.submenu, handlerMap),
      accelerator: item.accelerator,
      label: item.label,
      nodeId,
      checked: item.checked,
      enabled: item.enabled,
      role: item.role,
      type: item.type,
      visible: item.visible,
    };
  });
}

// 定义一个ElectronArduino类型的api对象
const api: ElectronArduino = {
  // 显示消息框
  showMessageBox: (options: MessageBoxOptions) =>
    // 调用ipcRenderer.invoke方法，发送CHANNEL_SHOW_MESSAGE_BOX通道，并传递options参数
    ipcRenderer.invoke(CHANNEL_SHOW_MESSAGE_BOX, options),
  // 显示打开对话框
  showOpenDialog: (options: OpenDialogOptions) =>
    // 调用ipcRenderer.invoke方法，发送CHANNEL_SHOW_OPEN_DIALOG通道，并传递options参数
    ipcRenderer.invoke(CHANNEL_SHOW_OPEN_DIALOG, options),
  // 显示保存对话框
  showSaveDialog: (options: SaveDialogOptions) =>
    // 调用ipcRenderer.invoke方法，发送CHANNEL_SHOW_SAVE_DIALOG通道，并传递options参数
    ipcRenderer.invoke(CHANNEL_SHOW_SAVE_DIALOG, options),
  // 获取应用程序信息
  appInfo: () => ipcRenderer.invoke(CHANNEL_APP_INFO),
  // 退出应用程序
  quitApp: () => ipcRenderer.send(CHANNEL_QUIT_APP),
  minAPP: () => ipcRenderer.send(LINGZHI_MINI),
  maxAPP: () => ipcRenderer.send(LINGZHI_MAX),
  // 判断是否是第一个窗口
  isFirstWindow: () => ipcRenderer.invoke(CHANNEL_IS_FIRST_WINDOW),
  // 请求重新加载
  requestReload: (options: StartupTasks) =>
    // 调用ipcRenderer.send方法，发送CHANNEL_REQUEST_RELOAD通道，并传递options参数
    ipcRenderer.send(CHANNEL_REQUEST_RELOAD, options),
  // 注册启动任务处理器
  registerStartupTasksHandler: (handler: (tasks: StartupTasks) => void) => {
    // 定义一个监听器
    const listener = (_: Electron.IpcRendererEvent, args: unknown) => {
      // 判断args是否是启动任务
      if (hasStartupTasks(args)) {
        // 如果是，调用handler方法
        handler(args);
      } else {
        // 如果不是，打印警告信息
        console.warn(
          `Events received on the ${CHANNEL_SEND_STARTUP_TASKS} channel expected to have a startup task argument, but it was: ${JSON.stringify(
            args
          )}`
        );
      }
    };
    // 监听CHANNEL_SEND_STARTUP_TASKS通道
    ipcRenderer.on(CHANNEL_SEND_STARTUP_TASKS, listener);
    return Disposable.create(() =>
      ipcRenderer.removeListener(CHANNEL_SEND_STARTUP_TASKS, listener)
    );
  },
  // 调度删除
  scheduleDeletion: (sketch: Sketch) =>
    ipcRenderer.send(CHANNEL_SCHEDULE_DELETION, sketch),
  // 设置表示文件名
  setRepresentedFilename: (fsPath: string) =>
    ipcRenderer.send(CHANNEL_SET_REPRESENTED_FILENAME, fsPath),
  // 显示绘图窗口
  showPlotterWindow: (params: { url: string; forceReload?: boolean }) =>
    ipcRenderer.send(CHANNEL_SHOW_PLOTTER_WINDOW, params),
  // 注册绘图窗口关闭处理程序
  registerPlotterWindowCloseHandler: (handler: () => void) => {
    const listener = () => handler();
    ipcRenderer.on(CHANNEL_PLOTTER_WINDOW_DID_CLOSE, listener);
    return Disposable.create(() =>
      ipcRenderer.removeListener(CHANNEL_PLOTTER_WINDOW_DID_CLOSE, listener)
    );
  },
  // 打开路径
  openPath: (fsPath: string) => ipcRenderer.send(CHANNEL_OPEN_PATH, fsPath),
  // 设置菜单
  setMenu: (menu: MenuDto[] | undefined): void => {
    mainMenuHandlers = new Map();
    const internalMenu = convertMenu(menu, mainMenuHandlers);
    ipcRenderer.send(CHANNEL_SET_MENU_WITH_NODE_ID, internalMenu);
  },
};

export function preload(): void {
  contextBridge.exposeInMainWorld('electronArduino', api);
  ipcRenderer.on(CHANNEL_MAIN_MENU_ITEM_DID_CLICK, (_, nodeId: string) => {
    const handler = mainMenuHandlers.get(nodeId);
    if (handler) {
      handler();
    }
  });
  console.log('Exposed Arduino IDE electron API');
}
