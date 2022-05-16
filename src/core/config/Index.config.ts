import { PagePath, PageSize } from "@type/PageConfig.types";
import { TrayConfig } from "@type/Tray.types";
import { ApiUrlConfig } from "@type/ApiConfig";
import {
  AboutPanelOptionsOptions,
  app,
  dialog,
  MenuItem,
  MenuItemConstructorOptions,
  nativeImage,
  shell,
  TouchBar,
  TouchBarConstructorOptions
} from "electron";

import Windows from "@/core/model/Windows.model";
import { join } from "path";
import { JadeOptions } from "jade";
import Utils from "@utils/Index.utils";
import JsonDB from "@utils/db.utils";
import { spawn } from "child_process";
import kill from "tree-kill";

const { TouchBarLabel, TouchBarButton, TouchBarSpacer, TouchBarPopover } = TouchBar;

export default class Config {
  /**
   * 启动页面默认为 Home.controller/Home
   * 程序内部根据这个配置自动载入Home.controller.ts文件，并自动调用类里面的Home()方法实现窗口创建
   * 可以改成其他，例如 PlayVideo.controller/Theme
   */
  public static StartPage: string = 'Home.controller/Home';

  public static isMac: Boolean = process.platform === 'darwin';
  public static isWindows: Boolean = process.platform === 'win32';
  public static isLinux: Boolean = process.platform === 'linux';
  public static LogsPath: string = "../../../logs/";

  // 升级地址
  public static UpdateUrl: string = "https://api.github.com/repos/helpcode/EasyProject/releases/latest";

  // ajax 请求地址
  public static ApiUrl: ApiUrlConfig = {
    BaseUrl: 'https://registry.npmjs.org',
    ApiList: {
      PlayList: '/list', // 获取视频列表
      PalyVideo: '/play', // 获取视频播放地址
      VideoComment: '/CommentList', // 获取视频评论
    }
  };

  // jade 模板引擎配置，更多参数自行阅读声明文件
  public static jadeCompile0ptions: JadeOptions = {
    cache: true,
    pretty: true, // 编译输出后是否保留源码格式，true 保持
    globals: {
      css: [
        '../../assets/js/lib/index.css',
      ],
      js: [
        '../../assets/js/lib/vue.js',
        '../../assets/js/lib/vuex.js',
        '../../assets/js/lib/vue-router.js',
        '../../assets/js/lib/axios.js',
        '../../assets/js/lib/index.js',
        '../../assets/js/lib/font.js'
      ]
    }
  };

  // 应用程序的页面地址，地址为打包后的相对路径
  public static PagePath: PagePath = {
    Welcome: join(__dirname, '../../application/page/Welcome/Welcome.html'),
    Home: join(__dirname, '../../application/page/Home/Home.html'),
    PlugInfo: join(__dirname, '../../application/page/PlugInfo/PlugInfo.html')
  };

  public static appAbout: AboutPanelOptionsOptions = {
    applicationName: "EasyProject",
    copyright: "copyright @bmy",
    website: "https://github.com/helpcode",
    credits: "统一管理组织凌乱无序的软件项目，带来一站式的快感。"
  };

  // 所有页面窗体配置
  public static PageSize: PageSize = {
    Welcome: {
      width: 330,
      height: 520,
      frame: false,
      backgroundColor: '#00000000',
      titleBarStyle: 'hidden',
      transparent: true,
      simpleFullscreen: true,
      vibrancy: 'menu',
      hasShadow: false,
      show: false,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        contextIsolation: false
      }
    },
    Home: {
      width: 1290,
      height: 810,
      minHeight: 630,
      minWidth: 954,
      frame: false,
      backgroundColor: '#00000000',
      titleBarStyle: 'hidden',
      transparent: true,
      simpleFullscreen: true,
      hasShadow: true,
      show: false,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        contextIsolation: false
      }
    },
    PlugInfo: {
      width: 860,
      height: 500,
      frame: false,
      modal: true,
      backgroundColor: '#fff',
      titleBarStyle: 'hidden',
      transparent: true,
      simpleFullscreen: true,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        contextIsolation: false
      }
    }
  };

  // Mac系统顶部全局菜单 右边图标
  public static TrayConfig: TrayConfig = {
    TopMenuRightImage: join(__dirname, '../../application/assets/img/logo.png'),
    TopMenuRightDropdown: [
      {
        label: '显示主窗口',
        click: (menuItem: any, browserWindow: any, event: any) => {
          Windows?.CurrentBrowserWindow?.show();
        }
      },
      { type: 'separator' },
      {
        label: '导入项目',
        accelerator: "Cmd+i",
        click: async (menuItem: any, browserWindow: any, event: any) => {
          let res = await Utils.ImportProject((item) => {
            console.log("Tray 导入的项目监听后被修改路径：", item)
            // event.reply('DirRemove', item)
            browserWindow.webContents.send('DirRemove', item)
          });
          if (!browserWindow.webContents.getURL().includes("Welcome.html")) {
            browserWindow.webContents.send('TouchBarImportProject', res)
          }
        }
      },
      {
        // TODO 导入 项目 的时候，这边项目列表不更新
        label: '项目列表(功能暂未全实现)',
        submenu: (JsonDB.project() as Array<any>).map((v:any,index) => {
          return {
            label: `${v.name}`,
            submenu: [
              {
                label: '在访达打开',
                click: async (menuItem: any, browserWindow: any, event: any) => {
                  await shell.openPath(v.Fullpath);
                }
              },
              {
                label: '在终端打开',
                click: async (menuItem: any, browserWindow: any, event: any) => {
                  spawn ('open', [ '-a', 'Terminal', v.Fullpath ])
                }
              },
              {
                label: '在应用打开',
                click: async (menuItem: any, browserWindow: any, event: any) => {
                  Windows.CurrentBrowserWindow.show();
                }
              },
            ]
          }
        }),
      },
      { type: 'separator' },
      {
        label: "设置...",
        accelerator: "Cmd+,",
        click: async (menuItem: any, browserWindow: any, event: any) => {
          if (!browserWindow.webContents.getURL().includes("Welcome.html")) {
            browserWindow.webContents.send('openSetting')
          } else {
          }
        }
      },
      {
        label: '隐藏Dock图标',
        type: 'checkbox',
        checked: false,
        click: async (menuItem: any, browserWindow: any, event: any) => {
          menuItem.checked ? app.dock.hide() : app.dock.show()
        }
      },
      { type: 'separator' },
      {
        label: `重启应用`,
        click: () => {
          Utils.killAllTask(() => {
            app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
            app.exit(0)
          })
        }
      },
      {
        label: `杀死 ${ app.name }`,
        click: () => {
          Utils.killAllTask(() => {
            app.exit(0)
          })
        }
      }
    ],
    TopMenuRightTips: '测试提醒'
  };

  // Mac or win 系统顶部全局菜单
  public static TemplateMenu: Array<(MenuItemConstructorOptions) | (MenuItem)> = [
    {
      label: app.name,
      submenu: [
        { label: `关于 ${ app.name }`, role: 'about' },
        { type: 'separator' },
        {
          label: "偏好设置",
          accelerator: "Cmd+,",
          click: async (menuItem: any, browserWindow: any, event: any) => {
            if (!browserWindow.webContents.getURL().includes("Welcome.html")) {
              browserWindow.webContents.send('openSetting')
            } else {
            }
          }
        },
        { type: 'separator' },
        { label: '服务', role: 'services' },
        { type: 'separator' },
        { label: `隐藏 ${ app.name }`, role: 'hide' },
        { label: '隐藏其他', role: 'hideOthers' },
        { label: '隐藏其他2', role: 'unhide' },
        { type: 'separator' },
        { label: `退出${ app.name }`, role: 'quit' }
      ]
    },
    {
      label: "文件",
      submenu: [
        {
          label: '导入项目',
          accelerator: "Cmd+i",
          click: async (menuItem: any, browserWindow: any, event: any) => {
            let res = await Utils.ImportProject((item) => {
              console.log("Menu 导入的项目监听后被修改路径：", item)
              // event.reply('DirRemove', item)
              browserWindow.webContents.send('DirRemove', item)
            });
            if (!browserWindow.webContents.getURL().includes("Welcome.html")) {
              browserWindow.webContents.send('TouchBarImportProject', res)
            }
          }
        },
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '恢复', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { type: 'separator' },
        { label: '粘贴保留样式', role: 'pasteAndMatchStyle' },
        { label: '删除', role: 'delete' },
        { label: '全选', role: 'selectAll' },
        { type: 'separator' },
        { label: '听写', submenu: [ { label: '开始听写', role: 'startSpeaking' }, { label: '停止听写', role: 'stopSpeaking' } ] }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '最大化', role: 'zoom' },
        { label: '关闭', role: 'close' }
      ]
    },
    {
      label: '帮助',
      role: 'help',
      submenu: [
        {
          label: '联系作者',
          click: async () => {
            await dialog.showMessageBox({
              type: "info",
              title: '联系作者',
              message: "如果你有任何使用建议或者反馈Bug\n请添加QQ：2271608011"
            })
          }
        },
        app.isPackaged
          ? {
              label: 'GitHub 主页',
              click: async () => {
                await shell.openExternal("https://github.com/helpcode")
              }
            }
        :  { label: '切换开发人员工具', role: 'toggleDevTools' },
      ]
    }
  ];

  // Mac touchbar 菜单
  public static TouchBarConfig: TouchBarConstructorOptions = {
    items: [
      new TouchBarButton({
        label: '导入项目',
        iconPosition: "left",
        icon: join(__dirname, '../../application/assets/img/+normal@2x.png'),
        click: async () => {
          let res = await Utils.ImportProject((item) => {
            console.log("TouchBar 导入的项目监听后被修改路径：", item)
            // event.reply('DirRemove', item)
            Windows.CurrentBrowserWindow.webContents.send('DirRemove', item)
          });
          if (!Windows.CurrentBrowserWindow.webContents.getURL().includes("Welcome.html")) {
            Windows.CurrentBrowserWindow.webContents.send('TouchBarImportProject', res)
          }
        }
      }),
      new TouchBarPopover({
        label: '帮助',
        showCloseButton: true,
        icon: (nativeImage.createFromPath(join(__dirname, '../../application/assets/img/help.png'))).resize({
          width: 16,
          height: 16
        }),
        items: new TouchBar({
          items: [
            new TouchBarButton({
              label: '联系作者',
              backgroundColor: '#3a3a3c',
              click: async () => {
                await dialog.showMessageBox({
                  type: "info",
                  title: '联系作者',
                  message: "如果你有任何使用建议或者反馈Bug\n请添加 QQ：2271608011"
                })
              }
            }),
            new TouchBarButton({
              label: 'Github主页',
              backgroundColor: '#3a3a3c',
              click: async () => {
                await shell.openExternal("https://github.com/helpcode")
              }
            })
          ]
        })
      }),
    ]
  };
}
