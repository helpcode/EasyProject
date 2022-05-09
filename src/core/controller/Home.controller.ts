import { Render, Ipc } from "@annotation/Creted.annotation";
import { HomeImplService } from "@service/impl/Home.impl.service";
import { Inject } from "@annotation/Ioc.annotation";
import { FileChice } from "@ipc/module/File.ipc";
import {app, Menu, shell, MenuItemConstructorOptions, MenuItem} from "electron";
import { Http } from "@net/Http.net";
import Config from "@config/Index.config";

export class HomeController {

  @Inject()
  public readonly HomeImplService!: HomeImplService;

  @Inject()
  public readonly _Http!: Http;

  /**
   * 启动欢迎页面
   * @constructor
   */
  @Render()
  public async Welcome() {
    return {
      title: '欢迎'
    }
  }

  /**
   * 主页面
   * @constructor
   */
  @Render()
  @Ipc([ FileChice ])
  public async Home(params?: { [key:string]:any }) {
    return {
      title: '首页'
    }
  }

  @Render()
  public async PlugInfo(params?: { [ key:string ] :any }) {
    console.log("插件详情页面接收到的参数：", params);
    return {
      title: '插件详情页面'
    }
  }
}
