import { dialog, Notification, OpenDialogOptions} from "electron";
import Windows from "@model/Windows.model"
export class Dialog {

    /**
     * 错误弹窗
     * @param title
     * @param content
     * @constructor
     */
    public static async ErrorBox(title: string, content: string): Promise<void> {
        await dialog.showErrorBox(title, content)
    }

    /**
     * 选择文件
     * @param title
     * @param message
     */
    public static async showDialog(params: OpenDialogOptions): Promise<any> {
        let SaveFile = await dialog.showOpenDialog(Windows.CurrentBrowserWindow, params);
        if(!SaveFile.canceled) {
            return SaveFile.filePaths
        }
    }
}
