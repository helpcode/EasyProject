import {join, parse} from "path";
import Config from "@config/Index.config";
import {BrowserWindow, Notification, NotificationConstructorOptions, app} from "electron";
import {mkdirSync, writeFileSync, existsSync, PathLike} from "fs";
import {renderFile} from "jade";
import Windows from "@model/Windows.model";
import globby from "globby";
import {diff} from 'deep-diff';
import JsonDB from "@utils/db.utils";
import {Touchbar} from "@interactive/Touchbar.interactive";
import {TrayInteractive} from "@interactive/Tray.interactive";
import {ApplicationMenu} from "@interactive/ApplicationMenu.interactive";

// require('electron-reload')(__dirname, {
//   electron: "/Applications/Electron.app/Contents/MacOS/Electron"
// })

export default class Utils {

  public static CheckAjaxUrl(): string {
    return Config.ApiUrl.BaseUrl
  }

  /**
   *
   * @param curV 新版本号
   * @param reqV 当前应用的版本号
   */
  public static compare(curV: string, reqV: string): boolean {
    if (curV && reqV) {
      //将两个版本号拆成数字
      var arr1 = curV.split('.'),
        arr2 = reqV.split('.');
      var minLength = Math.min(arr1.length, arr2.length),
        position = 0,
        diff = 0;
      //依次比较版本号每一位大小，当对比得出结果后跳出循环（后文有简单介绍）
      while (position < minLength && ((diff = parseInt(arr1[position]) - parseInt(arr2[position])) == 0)) {
        position++;
      }
      diff = (diff != 0) ? diff : (arr1.length - arr2.length);
      //若curV大于reqV，则返回true
      return diff > 0;
    } else {
      //输入为空
      console.log("版本号不能为空");
      return false;
    }
  }

  public static _TaskMap: Map<string, {[key:string]:any}[]> = new Map();

  /**
   * 存储启动命令，但是不能把读到的最新package.json直接赋值到Map中，因为这会覆盖掉前端在运行的命令状态
   * 所以需要对新读到的package.json和之前保存的进行差异性对比，然后不影响前数据的状态情况下修改 Map
   * @param key Map kay 数据key名称
   * @param val Map value 要存储的数据
   */
  public static setTask(key: string, val: any): any {
    if (Utils._TaskMap.has(key)) { // 判断这个项目的命令是否已经存储过
      for (let list of Utils._TaskMap.values()) {
        let diffArr = diff(list, val)  // 进行 diff json数据结构的差异对比
        if (diffArr != undefined) { // 如果有差异
          diffArr.forEach((v: any) => {
            switch (v.kind) {  // 判断差类型
              // A：表示package.json发生了改变
              case "A":
                switch (v.item.kind) { //具体何种改变需要再判断
                  // 如果为N表示package.json 新增了命令，那么在不影响前面数据状态的情况下
                  // 合并数据
                  case "N":
                    list = [...list, v.item.rhs]
                    Utils._TaskMap.set(key, list)
                    break;
                  // 如果为D表示package.json 删除了命令，那么在不影响前面数据状态的情况下
                  // 删除数据
                  case "D":
                    list = list.filter((s: any, i: number) => i != v.index);
                    Utils._TaskMap.set(key, list)
                    break
                }
                break;
            }
          });
          return Utils._TaskMap.get(key)
        // 如果没有差异，直接返回数据
        } else {
          console.log("没有差异")
          return Utils._TaskMap.get(key)
        }
      }
   // 没有存储过，进行存储
    } else {
      console.log("没有存储过")
      Utils._TaskMap.set(key, val)
      return Utils._TaskMap.get(key)
    }
  }

  /**
   * 查找任务对象
   * @param args
   */
  public static findOneTask(args: any) {
    let project = JsonDB.findName(args.name)
    let TaskList = Utils._TaskMap.get(project.Fullpath);
    if (TaskList !== undefined) {
      let a = TaskList.filter(v => {
        return v.ScriptName == args.ScriptName
      });
      a[0].path = project.Fullpath;
      return a[0]
    }
  }

  /**
   * 数组对象的深拷贝
   * @param arr
   * @constructor
   */
  public static DeepCopy(arr: any[]) {
    let newArr: any[] = [];
    arr.forEach((v:any) => {
      newArr.push(Object.assign({}, v))
    });

    return newArr
  }

  /**
   * 读取package.json 文件
   * @param path package.json 路径
   */
  public static readPackage(path: string): { [key: string]: any } {
    // 清除 require 的文件缓存
    delete require.cache[require.resolve(path)];
    return require(path)
  }

  /**
   * 写package.json配置文件
   * @param path package.json的路径
   * @param code package.json 里面的代码
   */
  public static writePackage(path: string, code: string): void {
    writeFileSync(path, code)
  }

  /**
   * 获取指定路径下的文件列表
   * @param path 路径
   */
  public static async globbyFile(path: string): Promise<Array<string>> {
    return await globby(['**'], {
      cwd: path, gitignore: true, absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/.svn/**'],
    });
  }

  /**
   * 返回新版本
   * @constructor
   */
  public static NewVersion(str: string): string {
    let arr: RegExpExecArray | any = /(\d+(\.\d+\.\d)?)/.exec(str);
    return arr[0]
  }

  /**
   * 根据传入的路径数组获取改路径下的文件目录结构
   * @param Path 路径数组
   * @constructor
   */
  public static async GetPathFileList(Path: string): Promise<any> {

    // 判断用户选中的路径中是否有package.json
    let PackageFile: string | string[] = (await Utils.globbyFile(Path))
      .filter(v => v.includes("package.json"))

    // 如果有表示为前端项目
    if (PackageFile.length !== 0) {
      // 读取用户选中项目中的 package.json
      let PackageObj: { [key: string]: any } = Utils.readPackage(PackageFile[0]);
      // 用项目名从数据库中条件查询这个项目
      let IsSave: undefined | { [key: string]: any } = JsonDB.isHaveName(PackageObj.name);

      console.log("IsSave ==== : ", IsSave)
      // 本地数据库没有存储过用户选中的项目配置
      if (IsSave == undefined) {
        let NewItem = {...PackageObj};
        delete NewItem.scripts;
        delete NewItem.devDependencies;
        delete NewItem.dependencies;
        let selectProject = {
          Fullpath: Path,
          FolderName: parse(Path).name,
          CurrentTabs: 'home',
          FolderIcon: '../../assets/img/GenericFolder.png',
          TaskRunList: [], // 前端的启动命令
          DependentList: [],// 前端的依赖
          ...NewItem
        }
        // 将package.json整个对象存入 json 数据库中，json数据库路径为：/Users/bmy/.project/db.json
        JsonDB.saveProject(selectProject);
        return selectProject;
      } else {
        return undefined
      }
      // 不是前端项目
    } else {
      console.log("不是前端项目")
      return undefined
    }
  }

  /**
   * 返回相对路径
   * @param path 路径
   * @constructor
   */
  public static GetFilePath(path: string): string {
    return join(__dirname, path)
  }

  /**
   * 根据配置返回对应的controller类，require后的类
   * @constructor
   */
  public static GetController(): any {
    return require(`../controller/${(Config.StartPage.split("/"))[0]}.js`)
  }

  /**
   * Home.controller 拆分为数组，然后controller的首字母C大写
   * 然后返回 HomeController 的类名
   */
  public static toUpperCase(cont: string): string {
    let Controller = cont.split(".")
    return Controller[0] + Controller[1].charAt(0).toUpperCase() + Controller[1].slice(1);
  }

  /**
   * 系统通知
   * @param parmas
   * @constructor
   */
  public static Notification(parmas: NotificationConstructorOptions): void {
    new Notification(parmas).show();
  }

  /**
   * 下载资源
   * @param url 需要下载的资源地址
   * @param path 下载后需要保存的路径
   * @constructor
   */
  public static DownFile(url: string, path: PathLike) {
    Windows.CurrentBrowserWindow.webContents.downloadURL(url)
    Windows.CurrentBrowserWindow.webContents.session.on(
      "will-download",
      (event: any, item: any, webContents: any) => {
        item.setSavePath(`${path}/${item.getFilename()}`);
        item.once('done', (event: any, state: any) => {
          if (state === 'completed') {
            // 下载成功后显示通知
            Utils.Notification({
              title: '下载完成',
              body: `您的视频 ${item.getFilename()} 已成功下载！`,
              silent: true,
            })
          }
        })
      }
    )
  }

  /**
   * 创建文件夹
   * @param name 文件夹
   * @param html html
   */
  public static mkdir(name: string, html: string): void {
    let path = join(__dirname, `../../application/page/${name}`);
    existsSync(path) ? null : mkdirSync(path)
    Utils.mkFile(path, name, html)
  }

  /**
   * 生成文件并写入数据
   * @param path 路径
   * @param name html文件名
   * @param html html数据
   */
  public static mkFile(path: string, name: string, html: string): void {
    writeFileSync(`${path}/${name}.html`, html)
  }

  /**
   * 创建启动窗口
   * @param target
   * @param name
   */
  public static async startWindows(target: any, name: string, params?: object) {
    // 如果项目已经打包过了，则无需再次创建文件
    if (!app.isPackaged) {
      let data: { [p: string]: any } = await target[name](params),
        Dom: string = renderFile(
          Utils.GetFilePath(`../../../src/application/page/${name}/${name}.jade`),
          Object.assign(Config.jadeCompile0ptions, data),
        );
      // 在dist/ 创建并生成对应的html文件
      Utils.mkdir(name, Dom)
    }

    try {
      // @ts-ignore
      Windows.CurrentBrowserWindow = new BrowserWindow(Config.PageSize[name]);
      // @ts-ignore
      Windows.CurrentBrowserWindow.loadFile(<string>Config.PagePath[name]);
      if (name == "Home") {
        app.whenReady().then(() => {
          // 创建顶部托盘
          new TrayInteractive()

          // 创建 touchbar
          new Touchbar()
          // 设置关于的信息
          app.setAboutPanelOptions(Config.appAbout)
        });
        Utils.ShowWindows()
      }
      Windows.CurrentBrowserWindow.show()

    } catch (e) {
      throw new Error("创建窗体失败，请检查配置文件，窗体的html路径是否正确！")
    }
  }

  public static ShowWindows() {
    let opacity = 0
    const time = setInterval(() => {
      if (opacity > 1) {
        opacity = 1
        clearInterval(time)
      } else {
        Windows.CurrentBrowserWindow.setOpacity(opacity)
        opacity = parseFloat((opacity + 0.1).toFixed(1))
        if (!Windows.CurrentBrowserWindow.isVisible()) {
          Windows.CurrentBrowserWindow.show()
        }
      }
    }, 70)

  }
}
