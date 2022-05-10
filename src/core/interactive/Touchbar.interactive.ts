import { shell, TouchBar, TouchBarButton as TB, nativeImage } from "electron";
import Windows from "@/core/model/Windows.model";
import Config from "@config/Index.config";
import JsonDB from "@utils/db.utils";
import { join } from "path";

const { TouchBarLabel, TouchBarButton, TouchBarPopover } = TouchBar;

export class Touchbar {
  constructor() {
    this.createdAllProject()
  }


  public createdAllProject(): void {
    let allProject = JsonDB.project();
    let touchBarButtonArr: Array<TB> = [];
    // 生成 项目列表 下的项目按钮
    (allProject as Array<any>).forEach((v, i) => {
      touchBarButtonArr.push(
        new TouchBarButton({
          label: v.name,
          backgroundColor: '#3a3a3c',
          click: async () => {
            await shell.openPath(v.Fullpath)
          }
        }),
      )
    });

    // 项目列表 Icon
    let projectIcon = nativeImage.createFromPath(join(__dirname, '../../application/assets/img/project.png'));

    // @ts-ignore
    if (Config.TouchBarConfig.items[1].label == "项目列表") {
      // @ts-ignore
      Config.TouchBarConfig.items.splice(1, 1)
    }
    // @ts-ignore
    Config.TouchBarConfig.items.splice(1, 0, new TouchBarPopover({
      label: '项目列表',
      icon: projectIcon.resize({ width: 18, height: 18 }),
      showCloseButton: true,
      items: new TouchBar({
        items: touchBarButtonArr
      })
    }))
    Windows.CurrentBrowserWindow.setTouchBar(new TouchBar(Config.TouchBarConfig))
  }
}
