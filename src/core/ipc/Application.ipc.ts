import {ipcMain, shell} from "electron";
import Utils from "@utils/Index.utils";
import Windows from "@model/Windows.model";
import Config from "@config/Index.config";
import { spawn, exec} from "child_process";
export class Application {
    /**
     * 创建非主窗体之外的窗体，
     * 在js渲染进程中触发事件
     * 1：独立窗体
     * 2：依附在主窗体上的子窗体
     * 3：依附在独立窗体上的子窗体
     * @constructor
     */
    CreatedWindow() {
        ipcMain.on('openWindow', async (event, arg: any) => {

            let ControllerName: string = arg.action.split("/")[0],
                MethodsName: string = arg.action.split("/")[1],
                data: object =  arg.data || {}

            // parent false 创建单独的窗体
            if (!arg.parent || !arg.hasOwnProperty("parent")) {
                // 是否要关闭上一级窗口
                if(arg.hasOwnProperty("closeParent") && arg.closeParent) {
                    Windows.CurrentBrowserWindow.hide()
                }
                let a = require(`../controller/${ControllerName}.js`);
                Utils.startWindows(new a[Utils.toUpperCase(ControllerName)](), MethodsName, data)
                event.returnValue = ""
                return false
            }

            // parent true 创建默认依附主窗口的子窗口
            if (arg.hasOwnProperty("parent") || arg.parent) {
                // @ts-ignore 合并配置参数，注入 parent: 当前默认启动的父类窗口实例
                Object.assign(Config.PageSize[MethodsName], { parent: Windows.CurrentBrowserWindow });
                // 实例化子窗口类，创建窗口
                let a = require(`../controller/${ControllerName}.js`);
                Utils.startWindows(new a[Utils.toUpperCase(ControllerName)](), MethodsName, data)
                event.returnValue = ""
                return false
            // 创建默认依附在自定义窗口的子窗口
            } else {
                console.log("创建默认依附在自定义窗口的子窗口")
            }
        })
    }

    /**
     * 打开浏览器窗口
     */
    shellWindows() {
        ipcMain.on("openExternal", async (event, arg:any) => {
            await shell.openExternal(arg.url)
            event.returnValue = "success"
        });
    }

    /**
     * 在文件管理器打开
     * 在终端打开（mac系统和win）
     */
    shellOpen() {
        ipcMain.on("OpenProject", async (event, arg:any) => {
            arg.type == 'file'
            ? await shell.openPath(arg.path)
            : Config.isMac
                ? spawn ('open', [ '-a', 'Terminal', arg.path ])
                : exec(`start cmd.exe /K cd /D ${arg.path}`)

            event.returnValue = "success"
        });
    }
}
