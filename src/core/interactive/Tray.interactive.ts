import { nativeImage, NativeImage, Menu, Tray } from "electron";
import Config from "@config/Index.config";
import JsonDB from "@utils/db.utils";
import Windows from "@/core/model/Windows.model";
import Utils from "@utils/Index.utils";

export class TrayInteractive {

    private tray!: Tray;

    constructor() {
        this.tray = new Tray(this.setTemplateImage());
        Windows.tray = this.tray;
        this.buildTrayMenu()
    }

    private buildTrayMenu() {
        let contextMenu: Menu = Menu.buildFromTemplate(Config.TrayConfig.TopMenuRightDropdown);
        this.tray.setToolTip(Config.TrayConfig.TopMenuRightTips)
        Utils.setTrayTitleNums();
        this.tray.setContextMenu(contextMenu)
    }

    /**
     * 创建 NativeImage 图片，图片会随着Mac系统主题的切换而自定变纯黑或纯白
     */
    private setTemplateImage(): NativeImage {
        let image: NativeImage = nativeImage.createFromPath(Config.TrayConfig.TopMenuRightImage);
        image.setTemplateImage(true)
        return image.resize({ width: 20, height: 20 })
    }
}
