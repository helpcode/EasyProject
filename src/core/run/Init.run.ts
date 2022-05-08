import { StartWindow } from "@annotation/Run.annotation";
import { CreateApplicationIpc } from "@annotation/Creted.annotation";
import { Application } from "@ipc/Application.ipc";
import { BaseControllerTypes } from "@type/BaseController.types";

/**
 * 启动类
 * 作用：注册全局事件
 * V2版本开发新的注解支持：
 * @StartWindow() 注解 根据 Index.config.ts 中的 StartPage 自动寻找controller文件夹下的ts文件，然后作为主窗体启动
 * @CreateApplicationIpc() 注册全局ipc
 */
@StartWindow()
@CreateApplicationIpc([ Application ])
export class Run implements BaseControllerTypes {
     event(): void {}
     ipc(): void {}
     monitor(): void {}
     ui(): void {}
}
