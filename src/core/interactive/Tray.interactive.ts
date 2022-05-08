import { nativeImage, NativeImage, Menu, Tray } from "electron";
import Config from "@config/Index.config";

export class TrayInteractive {

    private tray!: Tray;

    constructor() {
        this.tray = new Tray(this.setTemplateImage());
        this.buildTrayMenu()
        this.TrayItemClick()
    }

    /**
     * 全局菜单图标被点击时触发事件
     * @constructor
     */
    private TrayItemClick() {
        this.tray.on('click', () => {
            console.log("按钮被点击");
        })
    }

    private buildTrayMenu() {
        let contextMenu: Menu = Menu.buildFromTemplate(Config.TrayConfig.TopMenuRightDropdown);
        this.tray.setToolTip(Config.TrayConfig.TopMenuRightTips)
        this.tray.setContextMenu(contextMenu)
    }

    /**
     * 创建 NativeImage 图片，图片会随着Mac系统主题的切换而自定变纯黑或纯白
     */
    private setTemplateImage(): NativeImage {
        let image: NativeImage = nativeImage.createFromPath(Config.TrayConfig.TopMenuRightImage);
        image.setTemplateImage(true)
        return image
    }
}
