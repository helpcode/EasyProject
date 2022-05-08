import {ipcMain} from "electron";
import {Dialog} from "@interactive/Dialog.interactive";
import {Inject} from "@annotation/Ioc.annotation";
import {Http} from "@net/Http.net";
import Utils from "@utils/Index.utils";
import JsonDB from "@utils/db.utils";
import {existsSync, readJsonSync, remove} from "fs-extra";
import {createRequire} from "module"
import {exec, spawn} from "child_process";
import Config from "@config/Index.config";
import kill from "tree-kill";
import {resolve} from "path";
import {ProcessUtils} from "@utils/process.utils";

export class FileChice {

  @Inject()
  private readonly _Net!: Http;

  // @Inject()
  private readonly _process: ProcessUtils = new ProcessUtils();

  sendSettingConfig() {
    ipcMain.on("delete_themeList", async (event, args) => {
      event.returnValue = JsonDB.remove(args.value, `setting.${args.keyName}`)
    })

    ipcMain.on("push_themeList", async (event, args) => {
      event.returnValue = JsonDB.saveProject(args.value, `setting.${args.keyName}`)
    })

    ipcMain.on("getSettingConfig", async (event, args) => {
      event.returnValue = JsonDB.project("setting")
    })

    ipcMain.on("setSettingConfig", async (event, args) => {
      JsonDB.update(args.keyName, args.value)
      // event.returnValue = JsonDB.project("setting")
    })
  }

  getProcess() {
    ipcMain.on("getProcess", async (event, args) => {
      console.log("args.pid: ", args.pid)
      let res = await this._process.GetAllProcess(args.pid);
      event.returnValue = res
    })
  }

  setPackageJson() {
    ipcMain.on("setPackageJson", async (event, args) => {
      let pkg = JsonDB.findName(args.project);
      let packagePath = `${pkg.Fullpath}/package.json`;
      Utils.writePackage(packagePath, args.code)
    })
  }

  getPackageJson() {
    ipcMain.on("getPackageJson", async (event, args) => {
      let pkg = JsonDB.findName(args.project);
      let packagePath = `${pkg.Fullpath}/package.json`;
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
          {name: 'All', extensions: ['*']},
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

  InstallPlug() {
    ipcMain.on("installPlug", async (event, args) => {
      let pkg = JsonDB.findName(args.project);
      let cmd = args.status == 0
        ? `cd ${pkg.Fullpath} && npm i --save ${args.name}`
        : `cd ${pkg.Fullpath} && npm i --save-dev ${args.name}`;

      exec(cmd, (error, stdout, stderr) => {
        if (error == null) {
          event.returnValue = "success"
        } else {
          event.returnValue = stderr
        }
      })
    })
  }

  removeListProject() {
    // 从项目列表删除项目
    ipcMain.on("removeListProject", async (event, args) => {
      let a = JsonDB.remove({FolderName: args.name});
      if (a != undefined) {
        event.returnValue = "success"
      } else {
        event.returnValue = undefined
      }
    });


    // 从磁盘删除项目
    ipcMain.on("removeDistProject", async (event, args) => {
      let project = JsonDB.findName(args.name);
      console.log(project.Fullpath)
      try {
        // 从磁盘删除
        await remove(resolve(project.Fullpath));
        // 从本地数据库删除
        JsonDB.remove({FolderName: args.name});
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
        .find({FolderName: args.oldName})
        .assign({FolderName: args.newName})
        .write()
      event.returnValue = "success"
    });
  }

  changeIcon() {
    ipcMain.on("ChangeIcon", async (event, args) => {
      JsonDB.db.get('projects')
        .find({FolderName: args.name})
        .assign({FolderIcon: args.newIcon})
        .write()
      event.returnValue = "success"
    })
  }

  /**
   * 导入项目
   */
  openDirectory() {
    ipcMain.on("openDirectory", async (event, args) => {
      let DirectoryPath = await Dialog.showDialog({
        message: "选择您的项目",
        buttonLabel: '导入项目',
        properties: ['openDirectory', 'showHiddenFiles']
      });
      if (DirectoryPath) {
        let res = await Utils.GetPathFileList(DirectoryPath[0]);
        event.returnValue = res
      } else {
        event.returnValue = undefined
      }
    })
  }

  StopProject(): void {
    ipcMain.on("StopCmd", async (event, args) => {
      let currentTask: any = Utils.findOneTask(args);
      if (Config.isWindows) {
        try {
          spawn('taskkill', ['/T', '/F', '/PID', currentTask.Child.pid.toString()], {
            cwd: currentTask.path,
            stdio: ['pipe', 'pipe', 'ignore']
          });
          event.returnValue = null
        } catch (e) {
          event.returnValue = e.message
        }

      } else if (Config.isMac || Config.isLinux) {
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
      }
    })
  }

  RunProject(): void {
    ipcMain.on("RunCmd", async (event, args) => {
      let currentTask: any = Utils.findOneTask(args);

      let cmd = args.ScriptName == 'install'
        ? `cd ${currentTask.path} && npm install`
        : `cd ${currentTask.path} && npm run ${currentTask.ScriptName}`;

      try {
        currentTask.Child = spawn(cmd, {
          cwd: process.cwd(),
          stdio: ['inherit', 'pipe', 'pipe'],
          shell: true
        });

        console.log("currentTask: ", currentTask);

        // 修改运行状态
        currentTask.IsRuning = "runing"

        currentTask.Child.stdout.on('data', (data: Buffer) => {
          currentTask.RunLogs += data.toString();
          currentTask.pid = currentTask.Child.pid;

          // 后端返回 ScriptName 为前端助力，让前端的 sendMessage 监听
          // 中知道把 log 日志存放到数组的哪个 v.Terminal 中
          event.sender.send('sendMessage', {
            log: data.toString(),
            projectName: args.name,
            ScriptName: currentTask.ScriptName,
            pid: currentTask.Child.pid
          })
        });

        // 命令自动运行完成的时候，向前端发送进程关闭的通知
        currentTask.Child.stdout.on('close', (code: Number) => {

          currentTask.pid = 0;
          // 关闭进程
          currentTask.IsRuning = "idle"
          currentTask.RunLogs = ""
          currentTask.Child = null;

          console.log("close 进程: ", currentTask)


          event.sender.send('close', {
            ScriptName: currentTask.ScriptName,
            projectName: args.name
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

      let scriptList = (Utils.readPackage(`${project.Fullpath}/package.json`)).scripts;
      let NewSrciptList = []
      for (const key in scriptList) {
        NewSrciptList.push({
          ScriptName: key, // 命令的名称
          IsRuning: "idle", // idle 未运行  runing 运行
          RunLogs: '', // 命令运行产生的日志
          ScriptShell: scriptList[key], // 命令的脚本
          Terminal: null,
          Child: null,
          pid: 0
        })
      }
      NewSrciptList.unshift({
        ScriptName: 'install',
        IsRuning: "idle",
        RunLogs: '',
        ScriptShell: 'npm install',
        Terminal: null,
        Child: null,
        pid: 0
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
      event.returnValue = JsonDB.project()
    })
  }

  /**
   * 获取依赖
   * @constructor
   */
  GetDependentList() {
    ipcMain.on("GetDependentList", async (event, args) => {
      let project = JsonDB.findName(args.name);
      let pkg = Utils.readPackage(`${project.Fullpath}/package.json`);
      let ListArr: { title: string, list: { [key: string]: any }[] }[] = [];
      // 头像地址：https://avatars.dicebear.com/v2/identicon/插件名.svg
      // 请求地址：https://registry.npmjs.org/插件名
      [pkg.dependencies, pkg.devDependencies].forEach((v, i) => {
        ListArr.push({title: i == 0 ? '生产环境依赖' : '开发环境依赖', list: []})
        for (const key in v) {
          try {
            let ProjectPackage = `${project.Fullpath}/package.json`,
              resolvedPath = createRequire(ProjectPackage).resolve(`${key}/package.json`);
            if (existsSync(resolvedPath)) {
              const modeulePackage = readJsonSync(resolvedPath);

              ListArr[i].list.push({
                name: key,
                logoImg: `https://avatars.dicebear.com/v2/identicon/${key.replace("/", "-")}.svg`,
                currentVersion: v[key],
                description: modeulePackage.description,
                website: modeulePackage.homepage || (modeulePackage.repository && modeulePackage.repository.url) || `https://www.npmjs.com/package/${key.replace('/', '%2F')}`
              })
            }

          } catch (e) {
            event.returnValue = undefined
            // throw new Error(e.message)
          }
        }
      });
      event.returnValue = ListArr
    })
  }

  /**
   * 更新依赖包
   */
  updateDependencies() {
    ipcMain.on("uDependencies", async (event, args) => {
      let cmd, pkg = JsonDB.findName(args.project);
      args.type == 0 ? cmd = `cd ${pkg.Fullpath} && npm i --save ${args.name}@latest` : cmd = `cd ${pkg.Fullpath} && npm i --save-dev ${args.name}@latest`;

      exec(cmd, (error, stdout, stderr) => {
        if (error == null) {
          // JsonDB.db._.mixin({
          //   second: (array: any) =>
          //     args.type == 0
          //       ? array.dependencies
          //       : array.devDependencies
          // });
          // JsonDB.db.get('projects')
          //   .find({name: args.project})
          //   .second()
          //   .assign({[args.name]: `~${Utils.NewVersion(stdout)}`})
          //   .write()
          event.returnValue = "success"
        } else {
          event.returnValue = stderr
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
      args.type.class == 0 ? cmd = `cd ${pkg.Fullpath} && npm uninstall --save ${args.type.name}` : cmd = `cd ${pkg.Fullpath} && npm uninstall --save-dev ${args.type.name}`;
      exec(cmd, (error, stdout, stderr) => {
        if (error == null) {
          event.returnValue = "success"
        } else {
          event.returnValue = stderr
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
      console.log("pkg: ", pkg)
      let cmd = Config.isMac
        ? `cd ${pkg.Fullpath} && rm -rf node_modules && npm i`
        : `cd ${pkg.Fullpath} && rd/s/q node_modules && npm i`;
      console.log("RemoveModules: ", cmd)
      exec(cmd, (error, stdout, stderr) => {
        if (error == null) {
          event.returnValue = "success"
        } else {
          event.returnValue = stderr
        }
      })
    })
  }
}
