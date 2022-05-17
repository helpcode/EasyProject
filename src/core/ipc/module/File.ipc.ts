import { app, ipcMain, shell } from "electron";
import { Dialog } from "@interactive/Dialog.interactive";
import { Inject } from "@annotation/Ioc.annotation";
import { Http } from "@net/Http.net";
import Utils from "@utils/Index.utils";
import JsonDB from "@utils/db.utils";
import { existsSync, readJsonSync, remove, watch } from "fs-extra";
import { exec, execSync, spawn } from "child_process";
import Config from "@config/Index.config";
import kill from "tree-kill";
import { basename, dirname, resolve } from "path";
import { ProcessUtils } from "@utils/process.utils";
import { Package } from "@utils/package.utils";
import Windows from "@model/Windows.model";
import chokidar, { FSWatcher } from "chokidar";
import { WhichBin } from "@utils/whichBin.utils"
import moment from "moment"

export class FileChice {

  @Inject()
  private readonly _Net!: Http;

  @Inject()
  private readonly _Package!: Package;

  @Inject()
  private readonly _WhichBin!: WhichBin;

  // @Inject()
  private readonly _process: ProcessUtils = new ProcessUtils();

  sendSettingConfig() {
    ipcMain.on("checkUpdate", async (event, args) => {
      console.log("升级...")
      let returnVal: any = {};
      let res = await this._Net.GET({
        url: Config.UpdateUrl,
        custom: undefined,
        header: {
          'Authorization': 'Basic aGVscGNvZGU6Z2hwXzBEZmx3cDFQY2l6VVRNOFkxTTNBMDZxQlhTZGpvSjRHak4xMw=='
        }
      });
      if (res != undefined) {
        // 如果需要更新
        if (Utils.compare(res.tag_name, app.getVersion())) {
          returnVal.isUpdate = true;
          returnVal.detailed = res.body.split("\r\n");
          returnVal.version = res.tag_name;
          returnVal.title = res.name;
          returnVal.down = res.assets[ 0 ].browser_download_url;
          returnVal.updatedTime = res.assets[ 0 ].updated_at;
        } else {
          returnVal.isUpdate = false;
        }
        event.returnValue = returnVal
      } else {
        returnVal.isUpdate = false;
      }
    })

    ipcMain.on("selectEnvPath", async (event, args) => {
      let DirectoryPath = await Dialog.showDialog({
        message: "选择您的Node脚本所在路径",
        buttonLabel: '选择',
        properties: [ 'openDirectory', 'showHiddenFiles' ]
      });
      if (DirectoryPath) {
        JsonDB.update("envVariable", DirectoryPath[0])
        await this._WhichBin.initEnvPath();
        Utils.killAllTask(() => {
          app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
          app.exit(0)
        })
      }
    })

    ipcMain.on("getVersion", async (event, args) => {
      event.returnValue = { version: app.getVersion() }
    })

    ipcMain.on("delete_themeList", async (event, args) => {
      event.returnValue = JsonDB.remove(args.value, `setting.${ args.keyName }`)
    })

    ipcMain.on("push_themeList", async (event, args) => {
      event.returnValue = JsonDB.saveProject(args.value, `setting.${ args.keyName }`)
    })

    ipcMain.on("setPackageTypeindex", async (event, args) => {
      try {
        let res = execSync(`which ${args.packageType}`);
        console.log("res: ", res.toString())
        JsonDB.update(args.keyName, args.value)
        event.returnValue = { status: true, message: null }
      } catch (e) {
        event.returnValue = { status: false, message: e.message }
      }

    })

    ipcMain.on("getSettingConfig", async (event, args) => {
      event.returnValue = JsonDB.project("setting")
    })

    ipcMain.on("setSettingConfig", async (event, args) => {
      JsonDB.update(args.keyName, args.value)
      if (args.keyName == "isOpen") {
        const appFolder = dirname(process.execPath)
        const updateExe = resolve(appFolder, '..', 'EasyProject.app')
        const exeName = basename(process.execPath)
        app.setLoginItemSettings({
          openAtLogin: args.value,
          path: updateExe,
          args: [
            '--processStart', `"${ exeName }"`,
            '--process-start-args', `"--hidden"`
          ]
        });
      }
      // event.returnValue = JsonDB.project("setting")
    })
  }

  getProcess() {
    ipcMain.on("getProcess", async (event, args) => {
      let res = await this._process.GetAllProcess(args.pid);
      event.returnValue = res
    })
  }

  setPackageJson() {
    ipcMain.on("setPackageJson", async (event, args) => {
      let pkg = JsonDB.findName(args.project);
      let packagePath = `${ pkg.Fullpath }/package.json`;
      Utils.writePackage(packagePath, args.code)
    })
  }

  getPackageJson() {
    ipcMain.on("getPackageJson", async (event, args) => {
      let pkg = JsonDB.findName(args.project);
      let packagePath = `${ pkg.Fullpath }/package.json`;
      try {
        event.returnValue = Utils.readPackage(packagePath)
      } catch (e) {
        event.returnValue = e.message
      }
    })
  }

  SaveFile() {
    ipcMain.on('SaveFile', async (event, arg) => {
      let SaveFilePath = await Dialog.showDialog({
        title: "选择路径",
        message: "选择下载路径",
        buttonLabel: '亲，点我确认选择！',
        filters: [
          { name: 'All', extensions: [ '*' ] },
        ],
        properties: [
          'openDirectory',
          'createDirectory'
        ]
      });
      if (SaveFilePath != undefined) {
        Utils.DownFile(arg.url, SaveFilePath)
      }
    })
  }

  /**
   * 从项目列表删除项目
   */
  removeListProject() {
    // 从项目列表删除项目
    ipcMain.on("removeListProject", async (event, args) => {
      let { Fullpath } = JsonDB.findName(args.name,"name");
      Utils.removeDirWatch(Fullpath);
      let a = JsonDB.remove({ name: args.name });
      if (a != undefined) {
        Utils.updateTouchbarList();
        Utils.setTrayTitleNums();
        event.returnValue = "success"
      } else {
        event.returnValue = undefined
      }
    });

    // 从磁盘删除项目
    ipcMain.on("removeDistProject", async (event, args) => {
      let project = JsonDB.findName(args.name, "name");
      Utils.removeDirWatch(project.Fullpath);
      try {
        // 删除到回收站
        await shell.trashItem(resolve(project.Fullpath))
        // await remove();
        // 从本地数据库删除
        JsonDB.remove({ name: args.name });
        event.returnValue = "success"
      } catch (err) {
        event.returnValue = err.message
      }
    });

  }

  /**
   * 重命名项目
   */
  reNameProject() {
    ipcMain.on("reNameProject", async (event, args) => {
      JsonDB.db.get('projects')
        .find({ name: args.oldName })
        .assign({ name: args.newName })
        .write()
      Utils.updateTouchbarList();
      event.returnValue = "success"
    });
  }

  changeIcon() {
    ipcMain.on("ChangeIcon", async (event, args) => {
      JsonDB.db.get('projects')
        .find({ name: args.name })
        .assign({ FolderIcon: args.newIcon })
        .write()
      event.returnValue = "success"
    })
  }

  /**
   * 导入项目
   */
  openDirectory() {
    ipcMain.on("openDirectory", async (event, args) => {
      let res = await Utils.ImportProject((item) => {
        console.log("导入的项目监听后被修改路径：", item)
        event.reply('DirRemove', item)
      });
      event.returnValue = res;
    })
  }

  /**
   * 停止命令
   * @constructor
   */
  StopProject(): void {
    ipcMain.on("StopCmd", async (event, args) => {
      console.log("停止命令 args: ", args)
      let currentTask: any = Utils.findOneTask(args.name, args.ScriptName);
      kill(currentTask.Child.pid, (err: Error | undefined) => {
        if (err) {
          event.returnValue = err.message
        } else {
          currentTask.Child = null;
          currentTask.IsRuning = "idle"
          currentTask.RunLogs = ""
          event.returnValue = null
        }
      });
    })
  }

  /**
   * 运行命令
   * @constructor
   */
  RunProject(): void {
    ipcMain.on("RunCmd", async (event, args) => {
      console.log("运行命令: ", args)
      let currentTask: any = Utils.findOneTask(args.name, args.ScriptName);
      let cmd = args.ScriptName == 'install'
        ? `cd ${ currentTask.path } && ${this._Package.install("i")}`
        : `cd ${ currentTask.path } && ${this._Package.run(currentTask.ScriptName)}`;

      try {
        currentTask.Child = spawn(cmd, {
          cwd: process.cwd(),
          stdio: [ 'inherit', 'pipe', 'pipe' ],
          shell: true
        });
        // 修改运行状态
        currentTask.IsRuning = "runing"
        currentTask.time = Date.now()

        currentTask.Child.stdout.on('data', (data: Buffer) => {

          currentTask.RunLogs += data.toString();
          if (currentTask.Child != null) {
            currentTask.pid = currentTask.Child.pid;

            // 保存 你正在运行的 pid
            Windows.runPids.add(currentTask.pid);
            console.log("运行命令，添加pid: ", Windows.runPids)

            // 后端返回 ScriptName 为前端助力，让前端的 sendMessage 监听
            // 中知道把 log 日志存放到数组的哪个 v.Terminal 中
            event.sender.send('sendMessage', {
              log: data.toString(),
              projectName: args.name,
              ScriptName: currentTask.ScriptName,
              pid: currentTask.Child.pid
            })
          }
        });

        // 命令自动运行完成的时候，向前端发送进程关闭的通知
        currentTask.Child.stdout.on('close', (code: Number, signal: string) => {
          console.log("5 进程结束")

          // 删除已经停止的 pid
          Windows.runPids.delete(currentTask.pid);
          currentTask.pid = 0;

          console.log("停止命令，删除pid: ", Windows.runPids)

          // 关闭进程
          currentTask.IsRuning = "idle"
          currentTask.RunLogs = ""
          currentTask.Child = null;
          currentTask.time = Date.now() - currentTask.time

          event.sender.send('close', {
            ScriptName: currentTask.ScriptName,
            projectName: args.name,
            time: moment(currentTask.time).format("mm:ss")
          });

        });

      } catch (e) {
        console.log(e)
      }
      event.returnValue = ""
    })
  }

  /**
   * 获取项目的运行命令
   * @constructor
   */
  GetTaskList() {
    ipcMain.on("GetTaskList", async (event, args) => {
      let project = JsonDB.findName(args.name);

      let scriptList = (Utils.readPackage(`${ project.Fullpath }/package.json`)).scripts;
      let NewSrciptList = []
      for (const key in scriptList) {
        NewSrciptList.push({
          /**
           * 进程状态锁
           * true 表示命令未运行（进程停止时会变为true），前端运行按钮可以点击，
           * false 在你点击停止按钮后，进程还未被完全杀死前，再次点击运行按钮将无反应
           * 必须等待进程被完全杀死后，运行按钮才能再次使用
           * 如果不加锁，在前端 急速反复点击 运行停止按钮 的时候
           * 会导致进程运行后直接闪退，Mccos上存在
           */
          lock: true,
          ScriptName: key, // 命令的名称
          IsRuning: "idle", // idle 未运行  runing 运行
          RunLogs: '', // 命令运行产生的日志
          ScriptShell: scriptList[ key ], // 命令的脚本
          Terminal: null,
          Child: null,
          pid: 0,
          time: 0,
        })
      }
      NewSrciptList.unshift({
        lock: true,
        ScriptName: 'install',
        IsRuning: "idle",
        RunLogs: '',
        ScriptShell: this._Package.install("i"),
        Terminal: null,
        Child: null,
        pid: 0,
        time: 0,
      });

      // 深拷贝，去除再次回到【任务模块】的时候，Child中保存的子进程无法被ipc发送的问题
      let newItem = Utils.DeepCopy(Utils.setTask(project.Fullpath, NewSrciptList))
      newItem.forEach((v: any) => v.Child != null ? v.Child = null : '');
      event.returnValue = newItem
    })
  }

  /**
   * 应用一打开的时候获取项目列表
   * @constructor
   */
  ProjectList() {
    ipcMain.on("ProjectList", async (event, args) => {
      let allProject = JsonDB.project();
      event.returnValue = allProject.filter((v:any,index: number) => {
        // 打开软件的时候，判断本地项目路径是否存在
        // 把存在的返回数据给前端，来展示项目列表
        if (existsSync(v.Fullpath)) {
          Utils.addDirWatch(v.Fullpath, () => {
            event.reply('DirRemove', v)
          })
          return v
        } else {
          // 路径已经不存在了，删除json
          console.log("路径已经不存在了，删除json")
          JsonDB.remove({ name: v.name });
        }
      });
    })
  }

  /**
   * 获取依赖
   * @constructor
   */
  GetDependentList() {
    ipcMain.on("GetDependentList", async (event, args) => {
      console.log("获取依赖 ==== args: ", args)
      let project = JsonDB.findName(args.name);
      let pkg = Utils.readPackage(`${ project.Fullpath }/package.json`);
      let ListArr: { title: string, list: { [ key: string ]: any }[] }[] = [];

      // 检查项目中是否有 node_modules
      if (existsSync(`${project.Fullpath}/node_modules`)) {
        // 头像地址：https://avatars.dicebear.com/v2/identicon/插件名.svg
        // 请求地址：https://registry.npmjs.org/插件名
        [ pkg.dependencies, pkg.devDependencies ].forEach((v, i) => {
          ListArr.push({
            title: i == 0 ? '生产环境依赖' : '开发环境依赖',
            list: []
          })
          for (const key in v) {
              let otherPath = `${project.Fullpath}/node_modules/${key}/package.json`
              if (existsSync(otherPath)) {
                const modeulePackage = Utils.readPackage(otherPath);
                ListArr[ i ].list.push({
                  name: key,
                  logoImg: `https://avatars.dicebear.com/v2/identicon/${ key.replace("/", "-") }.svg`,
                  currentVersion: v[ key ],
                  description: modeulePackage.description,
                  website: modeulePackage.homepage || (modeulePackage.repository && modeulePackage.repository.url) || `https://www.npmjs.com/package/${ key.replace('/', '%2F') }`
                })
              }
          }
        });
      } else {
        event.returnValue = undefined
      }
      event.returnValue = ListArr
    })
  }

  /**
   * 安装依赖
   * @constructor
   */
  InstallPlug() {
    ipcMain.on("installPlug", async (event, args) => {
      let pkg = JsonDB.findName(args.project);
      let cmd = `cd ${ pkg.Fullpath } && ${this._Package.install("other", args)}`
      exec(cmd, (error, stdout, stderr) => {
        if (error == null) {
          event.reply('reDependentSuccess', 'ok')
        } else {
          // event.returnValue = stderr
          event.reply('reDependentSuccess', {
            message: error.message
          })
        }
      })
    })
  }

  /**
   * 更新依赖包
   */
  updateDependencies() {
    ipcMain.on("uDependencies", async (event, args) => {
      let cmd, pkg = JsonDB.findName(args.project);
      cmd = `cd ${ pkg.Fullpath } && ${this._Package.up(args)}`
      exec(cmd, (error, stdout, stderr) => {
        if (error == null) {
          event.reply('reDependentSuccess', 'ok')
        } else {
          console.log(error.message)
          // event.returnValue = stderr
          event.reply('reDependentSuccess', {
            message: error.message
          })
        }
      })
    })
  }

  /**
   * 删除依赖包
   */
  deleteDependencies() {
    ipcMain.on("dDependencies", async (event, args) => {
      let cmd, pkg = JsonDB.findName(args.project);
      cmd = `cd ${ pkg.Fullpath } && ${this._Package.uninstall(args.type)}`;
      console.log("删除依赖包: ", cmd)
      exec(cmd, (error, stdout, stderr) => {
        console.log(stdout)
        if (error == null) {
          event.reply('reDependentSuccess', 'ok')
        } else {
          event.reply('reDependentSuccess', {
            message: error.message
          })
        }
      })
    })
  }

  /**
   * 初始化依赖
   */
  installDependent() {
    ipcMain.on("reDependent", async (event, args) => {
      console.log("args.name: ", args.name)
      let pkg = JsonDB.findName(args.name)
      let cmd = `cd ${ pkg.Fullpath } && rm -rf node_modules && ${this._Package.install("i")}`
      console.log("初始化依赖: ",cmd)
      exec(cmd, (error, stdout, stderr) => {
        if (error == null) {
          event.reply('reDependentSuccess', 'ok')
        } else {
          // event.returnValue = stderr
          event.reply('reDependentSuccess', {
            message: error.message
          })
        }
      })
    })
  }
}
