require('./moduleAlias');

import { app, dialog } from "electron";
import { Run } from "@run/Init.run";
import Windows from "@/core/model/Windows.model";

/**
 * 解决 Electron 打包发布后，通过GUI点击 xx.app 启动成程序
 * child_process 无法执行导致应用的 命令 无法启动。主要原因
 * 是从GUI启动时 $PATH 环境变量错误，这边需要手动合并环境变量。
 * windows 不会出问题，linux 和 macos 都存在
 */
if (process.platform != 'win32') {
    process.env.PATH = [
        './node_modules/.bin',
        '/usr/local/bin',
        '/usr/local/bin/node',
        '/usr/local/bin/npm',
        '/usr/local/lib/node_modules',
        process.env.PATH,
    ].join(':');
}

// console.log(" process.env.PATH: ",  process.env.PATH)
// console.log()
// @ts-ignore
// dialog.showErrorBox("测试1", process.env.PATH.toString())

app.on('ready', () => {
    new Run()
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    Windows.CurrentBrowserWindow.show()
});
