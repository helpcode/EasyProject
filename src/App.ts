require('./moduleAlias');
import { app, dialog } from "electron";
import { Run } from "@run/Init.run";
import Windows from "@/core/model/Windows.model";
import { WhichBin } from "@utils/whichBin.utils"

app.on('ready', async () => {
    /**
     * 解决 Electron 打包发布后，通过GUI点击 xx.app 启动成程序
     * child_process 无法执行导致应用的 命令 无法启动。主要原因
     * 是从GUI启动时 $PATH 环境变量错误，这边需要手动合并环境变量。
     * windows 不会出问题，linux 和 macos 都存在
     */
    if (process.platform != 'win32') {
        let which = new WhichBin()
        await which.initEnvPath();
    }
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
