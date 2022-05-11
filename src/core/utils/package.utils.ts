import JsonDB from "@utils/db.utils";
import { Injectable } from "@annotation/Ioc.annotation";

@Injectable()
export class Package {


  /**
   * 获取当前你选择的包管理工具
   */
  public getPackageTool(): string {
    let allType = JsonDB.findOne("packageType", "setting");
    let index = JsonDB.findOne("packageTypeSelect", "setting");
    return allType[index];
  }

  /**
   * 初始化 和 安装软件的命令
   * @param type
   *   i  初始化依赖
   *   other 安装单个插件
   */
  install(type: string = "", arg?: any) {
    // 如果是npm 和 cnpm
    let tool = this.getPackageTool();
    if (type == "other") {
      // 阶段  true 正式阶段  false 开发阶段
      let stage: boolean = arg.status == 0 ? true : false;

      if (tool == "npm" || tool == "cnpm") {
        return `${tool} i --${stage ? 'save' : 'save-dev'} ${arg.name}`;
      } else if (tool == "yarn") {
        return `${tool} add ${stage ? '' : '--dev'} ${arg.name}`
      } else if (tool == "pnpm") {
        return `${tool} add ${stage ? '' : '-D'} ${arg.name}`
      }
    } else {
      return `${tool} install`
    }
  }


  /**
   * 删除包
   */
  uninstall(arg?: any) {
    // 如果是npm 和 cnpm
    let tool = this.getPackageTool();
    // 阶段  true 正式阶段  false 开发阶段
    let stage: boolean = arg.class == 0 ? true : false;
    if (tool == "npm" || tool == "cnpm") {
      return `${tool} uninstall --${stage ? 'save' : 'save-dev'} ${arg.name}`;
    } else if (tool == "yarn") {
      return `${tool} remove ${arg.name}`
    } else if (tool == "pnpm") {
      return `${tool} rm ${stage ? '--save-prod' : '--save-dev'} ${arg.name}`
    }
  }


  /**
   * 运行 script 命令
   * @param script
   */
  run(script: string) {
    let tool = this.getPackageTool();
    return `${tool} run ${script}`
  }

  /**
   * 更新软件包
   * @param script
   */
  up(arg?: any) {
    let tool = this.getPackageTool();
    // 阶段  true 正式阶段  false 开发阶段
    let stage: boolean = arg.type == 0 ? true : false;

    if (tool == "npm" || tool == "cnpm") {
      return `${tool} i --${stage ? 'save' : 'save-dev'} ${arg.name}@latest`;
    } else if (tool == "yarn") {
      return `${tool} upgrade --latest ${arg.name}`
    } else if (tool == "pnpm") {
      return `${tool} up --latest ${arg.name}`
    }
  }

}