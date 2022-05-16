import { dialog } from "electron";
import { join } from "path";
import JsonDB from "@utils/db.utils";
import { Inject, Injectable } from "@annotation/Ioc.annotation";

const { execSync, exec, ExecException} = require("child_process");

@Injectable()
export class WhichBin {
  private environment: string[] = [ 'node', 'npm', 'cnpm', 'yarn', 'pnpm' ];
  private retult: (string | undefined)[] = [
    './node_modules/.bin',
    process.env.PATH
  ]

  private exec(cmd: string): string | boolean {
    try {
      let res = execSync(`which ${cmd}`);
      return res.toString().replace(/\n/g,"");
    } catch (e) {
      dialog.showErrorBox("eeeee: ", e.message)
      return false;
    }
  }

  /**
   *
   */
  public async initEnvPath() {
    let path: string = await JsonDB.findOne("envVariable", "setting");
    // npm i -g 全局安装依赖的路径
    this.retult.push(join(path, "../lib/node_modules"))
    // 你选的文件夹，这里面 的 shell 可以被全局调用
    this.retult.push(path)
    // nodejs 路径
    this.retult.push(`${path}/node`);
    // npm 路径
    this.retult.push(`${path}/npm`);
    this.retult.push(`${path}/npx`);
    process.env.PATH = this.retult.join(":");
  }

  public initEnvironment() {
    this.environment.forEach(async v => {
      let res = this.exec(v)
      if (res) {
        dialog.showErrorBox("res: ", res.toString())
        if ((res as string).includes("/bin/node")) {
          // 找到所有存放所有命令的 父级
          this.retult.push((res as string).replace("/bin/node", "/bin"))
          // 找到存放 npm i -g 安装的路径
          this.retult.push((res as string).replace("/bin/node", "/lib/node_modules"))
        }
        this.retult.push((res as string))
      }
    });
    dialog.showErrorBox("结果结果: ", JSON.stringify(this.retult))
    console.log("结果：", )
    process.env.PATH = this.retult.join(":")
  }
}


// let res = execSync("which node && which npm && which cnpm && which yarn");
// console.log(res.toString())
//
// environment.forEach(v => {
//   let res = execSync("which node && which npm && which cnpm && which yarn");
// })