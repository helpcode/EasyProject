const {ipcRenderer, shell} = require("electron");
const {Terminal} = require("xterm");
const {WebLinksAddon} = require("xterm-addon-web-links");
const Utils = require("../Utils/index.js");
const {ProcessUtils} = require("../../../../core/utils/process.utils");

module.exports = {
  data() {
    return {
      isNeedWatch: true,
      isShowError: false, // 是否显示错误弹窗
      ErrorText: '', // 错误具体信息
      activeName: '',
      // 保存的就是 FolderName
      projectName: '',
      isRunScript: false, // 是否启动过命令
      titleTips: '默认显示 [任务] 中展开的命令', // 提示文字
      currentSrcipt: '', // 保存当前你点击过的折叠面板，也就是 ScriptName
      isShowInstallDev: false, // 安装依赖弹窗是否显示
      Environment: '', // 你选择安装插件的环境
      PlugInput: '', // 用户输入的插件名称
      currentProcess: [], // 当前命令的进程占用
      PlugList: [],
      TerminalConfig: {
        scrollback: 5000,
        disableStdin: true,
        useFlowControl: true,
        cols: 80,
        rows: 16,
        convertEol: true,
        theme: {
          background: '#1d2935',
          cursor: 'rgba(255, 255, 255, .4)',
          selection: 'rgba(255, 255, 255, 0.3)',
          magenta: '#e83030',
          brightMagenta: '#e83030',
          black: "#000000",
          red: "#e83030",
          brightRed: "#e83030",
          green: "#42b983",
          brightGreen: "#42b983",
          brightYellow: "#ea6e00",
          yellow: "#ea6e00",
          cyan: "#03c2e6",
          brightBlue: "#03c2e6",
          brightCyan: "#03c2e6",
          blue: "#03c2e6",
          white: "#d0d0d0",
          brightBlack: "#808080",
          brightWhite: "#ffffff",
        }
      }
    }
  },
  created() {
    this.GetShellMessage();
    this.reDependentSuccess();
    this.onClose();
    this.projectName = this.$route.query.name;
    this.activeName = this.$route.query.active;
    this.isNeedWatch = this.$route.query.isNeedWatch;
    this.SwitcTabs(this.activeName)
  },
  watch: {
    $route: async function (to, from) {
      console.log("1 watch监听的$route为: ", this.$route)

      this.projectName = this.$route.query.name;
      this.activeName = this.$route.query.active;
      this.isNeedWatch = this.$route.query.isNeedWatch;

      // 如果进入页面是 home（配置）的话就获取最新的package.json
      if (this.activeName == "home") {
        this.SwitcTabs(this.$route.query.active)
      }

      if (this.isNeedWatch) {
        this.currentSrcipt = ""
      }

      // 如果进入tabs的 task 任务栏
      // 1：从其他项目切换回来，RunLogs 不为空但是 Terminal 所对应的html被刷没了
      //    这时候 this.isHasTerminal() 返回 false，所以重新初始化终端创建html并载入日志
      // 2：在当前项目中切换tab，因为页面被 keep-alive 缓存，所以Terminal 的 html还在
      //    这时候 this.isHasTerminal() 返回 true，所以不需要重新创建终端
      if (this.activeName == "task") {
        let current = this.CurrentTask(this.currentSrcipt);
        if (current && current.Terminal != null &&
          !(await this.isHasTerminal())) {
          console.warn("2: watch 创建终端")
          // 为默认展开的 折叠面板 重新创建终端写入之前的日志
          if (this.currentSrcipt == current.ScriptName) {
            current.Terminal = null
            console.warn("3: 为默认展开的 折叠面板 创建终端")
            this.newTerminal(current)
            this.setContent(current.Terminal, current.RunLogs)
          }
        }
      }
    },
    deep: true,
  },

  methods: {
    ShowSetting() {
      let res = this.CurrentTask(this.currentSrcipt);
      if (res != null && res.pid != 0) {
        console.log("进程的pid进程: ", res)
        let process = ipcRenderer.sendSync('getProcess', {
          action: '通过pid获取进程的CPU，内存占用',
          pid: res.pid
        });

        console.log("进程信息为：", process)

        if (process.hasOwnProperty("isRunScript")) {
          this.titleTips = process.message;
          this.isRunScript = false;
          this.$forceUpdate();
        } else {
          this.currentProcess = [process];
          this.isRunScript = true;
        }
      } else {
        this.isRunScript = false;
      }
    },

    /**
     * 展示package.json 配置文件
     * @returns {Promise<void>}
     * @constructor
     */
    async ShowPackageJson() {
      this.$nextTick(async () => {
        // 避免每次点击回 配置 时候，重复初始化创建编辑器导致删除的时候多删文字的问题
        let el = document.querySelector(`.package`);
        if (el.children.length == 0) {
          let JsonCode = ipcRenderer.sendSync('getPackageJson', {
            action: '获取项目的配置文件',
            project: this.projectName
          });
          console.log("读取到的 package.json文件代码为 : ", JsonCode)
          let editor = await Utils.initVscodeEdit(this.projectName);
          editor.setValue(JSON.stringify(JsonCode))
          // 格式化json代码
          setTimeout(() => editor.getAction('editor.action.formatDocument').run(), 300)
          // 监听文件修改，实时获取代码，传给 主进程 来写到对应项目的package.json中
          editor.onDidChangeModelContent((e) => {
            // console.log(editor.getValue())
            ipcRenderer.send('setPackageJson', {
              action: '保存前端修改的配置文件',
              project: this.projectName,
              code: editor.getValue()
            });
          });
        }
      })
    },

    /**
     * 安装插件
     * @constructor
     */
    async SearchList() {
      if (this.PlugInput.length != 0 && this.Environment.length != 0) {

        this.$store.dispatch('loading', "安装插件很慢，请耐心等待...")
        ipcRenderer.send('installPlug', {
          action: '安装插件',
          project: this.projectName,
          name: this.PlugInput,
          status: this.Environment
        });
        this.isShowInstallDev = false

      } else {
        this.$notify.error({
          title: '提示',
          message: '插件名和安装环境都不能为空'
        });
      }
    },

    /**
     * 判断tabs点击类型
     * @param active
     * @constructor
     */
    SwitcTabs(active) {
      console.log("你点击的tabs类型: ", active)
      switch (active) {
        case 'home':
          this.ShowPackageJson()
          break;
        case 'task':
          this.GetTaskListData()
          break;
        case 'dependent':
          this.GetDependentListData()
          break;
        case 'setting':
          // this.ShowSetting()
          break;
      }
    },

    /**
     * 在你点击的命令运行前，先初始化终端
     */
    initTerminal(item) {
      // 如果没有运行过终端，那么创建，避免重复创建
      if (item.Terminal == null) {
        this.newTerminal(item)
      }
    },

    newTerminal(item) {
      item.Terminal = new Terminal(this.TerminalConfig);
      // 终端链接被点击时候，打开链接
      item.Terminal.loadAddon(new WebLinksAddon((event, uri) => {
        this.WebSite(uri)
      }));
      let refKey = this.projectName + "_" + item.ScriptName;
      this.$nextTick(() => {
        item.Terminal.open(this.$refs[refKey][0]);
      })
    },

    /**
     * 命令运行后，nodejs 会通过 sendMessage 实时输出日志，
     * @constructor
     */
    GetShellMessage() {
      let setLogCallback = (event, arg) => {
        let e = this.$store.getters.GET_CURRENTTASK(arg.projectName)
        let curr = e.filter(v => {
          if (v.ScriptName == arg.ScriptName) {
            return v;
          }
        });
        let res = curr[0]
        res.RunLogs += arg.log;
        res.pid = arg.pid;
        this.setContent(res.Terminal, arg.log)
      }
      ipcRenderer.on('sendMessage', setLogCallback);
      this.removeListener('sendMessage', setLogCallback)
    },

    // 监听进程关闭的通知
    onClose() {
      let closeCallback = async (event, arg) => {
        let e = this.$store.getters.GET_CURRENTTASK(arg.projectName)
        console.log("***监听进程关闭的通知****: ", e)
        let curr = e.filter(v => {
          if (v.ScriptName == arg.ScriptName) {
            return v;
          }
        });
        let res = curr[0]
        res.lock = true;
        res.pid = 0;
        res.IsRuning = "idle";
        res.RunLogs += "命令已结束...";
        res.Terminal.writeln(`命令已结束..`)
        res.Terminal.writeln(`运行时间: ${arg.time}s..`)
      }
      ipcRenderer.on('close', closeCallback);
      this.removeListener('close', closeCallback)
    },

    /**
     * ipcRenderer.on 使用的是 EventEmitter
     * Nodejs 的 EventEmitter.on 没有做重复检查，所以会出现 进入设置页面，再返回的时候
     * ipcRenderer.on 多次监听导致命令运行+停止的日志出现重复。
     * 所以这里需要对 on 的次数进行判断，多了则删除。
     * @param channel 事件名
     * @param listener 回调函数
     */
    removeListener(channel, listener) {
      let count = ipcRenderer.listenerCount(channel);
      if (count > 1) {
        ipcRenderer.removeListener(channel, listener)
      }
    },

    /**
     * 停止命令运行
     * @param item
     * @constructor
     */
    StopCmd(item) {
      item.lock = false;
      let StopStatus = ipcRenderer.send('StopCmd', {
        action: '运行项目',
        name: this.projectName,
        ScriptName: item.ScriptName
      });

      if (StopStatus != null) {
        this.$notify.error({
          title: '命令执行失败',
          message: StopStatus
        });
      } else {
        item.IsRuning = "idle";
      }
    },

    /**
     * 运行命令
     * @param key
     * @constructor
     */
    RunCmd(item) {
      if (item.lock) {
        item.IsRuning = "runing";
        this.initTerminal(item);
        ipcRenderer.send('RunCmd', {
          action: '运行项目',
          name: this.projectName,
          ScriptName: item.ScriptName
        });
      }
    },

    /**
     * 格式化日志
     * @param term
     * @param value
     * @param ln
     */
    setContent(term, value, ln = true) {
      if (value != undefined && value.indexOf('\n') !== -1) {
        value.split('\n').forEach(
          t => this.setContent(term, t)
        )
        return
      }
      if (typeof value === 'string') {
        term[ln ? 'writeln' : 'write'](value)
      } else {
        term.writeln('')
      }
    },

    /**
     * 清除日志
     * @param v
     */
    clearLog(v) {
      v.Terminal.clear()
      v.RunLogs = ""
    },

    /**
     * 滚动到底部
     * @param v
     * @constructor
     */
    ToBottom(v) {
      v.Terminal.scrollToBottom()
    },

    /**
     * 复制日志
     * @param v
     */
    copyContent(v) {
      const textarea = v.Terminal.textarea
      const textValue = textarea.value
      const emptySelection = !v.Terminal.hasSelection()
      try {
        if (emptySelection) {
          v.Terminal.selectAll()
        }
        var selection = v.Terminal.getSelection()
        textarea.value = selection
        textarea.select()
        document.execCommand('copy')
        this.$notify({
          title: '提示',
          message: '日志复制成功',
          type: 'success'
        });
      } finally {
        textarea.value = textValue
        if (emptySelection) {
          v.Terminal.clearSelection()
        }
      }
    },

    /**
     * 打开依赖的详情页
     * @constructor
     */
    PlugsInfo(item) {
      // ipcRenderer.send('openWindow', {
      //   action: 'Home.controller/PlugInfo',
      //   parent: true,
      //   data: item
      // });
      console.log("item :", item)
    },

    /**
     * 删除依赖包
     * @param va
     * @param type
     * @param PackName
     */
    deletePack(va, type, PackName) {
      this.$confirm(`确定删除依赖：${PackName}吗？删除后，请修改项目代码！`, '删除提示', {
        distinguishCancelAndClose: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('loading', "删除依赖很慢，请耐心等待...")
        va.class = type
        ipcRenderer.send('dDependencies', {
          action: '删除依赖',
          type: va,
          project: this.projectName
        });
      })
    },

    // type == 0 生产环境依赖， == 1 开发环境依赖
    /**
     * 更新依赖包
     * @param type
     * @param PackName
     */
    updatePack(type, PackName) {
      this.$store.dispatch('loading', "更新依赖很慢，请耐心等待...")
      ipcRenderer.send('uDependencies', {
        action: '更新依赖',
        type: type,
        name: PackName,
        project: this.projectName
      });
    },

    /**
     * 打开依赖包主页
     * @param url
     * @constructor
     */
    WebSite(url) {
      ipcRenderer.sendSync('openExternal', {
        action: '浏览器打开',
        url: url,
      });
    },

    /**
     * 获取启动命令
     * @constructor
     */
    GetTaskListData() {
      if (this.CurrentTaskList.length == 0) {
        let a = ipcRenderer.sendSync('GetTaskList', {
          action: '获取项目的运行命令',
          name: this.projectName
        });
        console.log("项目的运行命令：", a)
        this.$store.commit('SET_TASKRUNLIST', {
          id: this.projectName,
          TaskRunList: a
        });
        console.log("ProjectList: ", this.$store.state.ProjectList)
      }
    },

    /**
     * 获取项目的依赖信息
     * @constructor
     */
    GetDependentListData() {
      let status = ipcRenderer.sendSync('GetDependentList', {
        action: '依赖信息',
        name: this.projectName
      });

      if (status == undefined) {
        this.$confirm(`项目的 node_modules 缺失部分依赖，点击确定重新安装依赖！`, '依赖缺失', {
          distinguishCancelAndClose: true,
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'error'
        }).then(() => {
          this.$store.dispatch('loading', "安装依赖很慢，请耐心等待...")
          ipcRenderer.send('reDependent', {
            action: '更新项目',
            name: this.projectName
          });
        })
      } else {
        this.$store.commit('SET_DEPENDENTLIST', {
          id: this.projectName,
          DependentList: status
        });
      }
    },

    /**
     * 重新安装依赖完成，后端发送的回调
     */
    reDependentSuccess() {
      let success = (event, arg) => {
        this.$store.state.loadingService.close();
        if (arg == "ok") {
          this.GetDependentListData();
        } else {
          this.isShowError = true;
          this.ErrorText = arg.message
        }
      }
      ipcRenderer.on('reDependentSuccess', success)
      this.removeListener('reDependentSuccess', success)
    },


    /**
     * 顶部tabs点击事件
     * @param v
     */
    handleClick(v) {
      console.log("handleClick 顶部tabs点击事件: ", v)
      this.isNeedWatch = false;

      // 切换tabs的时候，将这个项目用户打开的对应tabs name 保存到 ProjectList 中
      this.$store.commit('SET_CURRENTTABS', {id: this.projectName, currentTabs: this.activeName});
      this.$router.push({query: {name: this.projectName, active: this.activeName, isNeedWatch: true}})
      this.SwitcTabs(v.name)
    },

    /**
     * 折叠面板被激活时候触发
     * @param activeNames 折叠面板被点击 serve_2
     * 解释：serve 是这个项目所有命令的名称
     *      2     是这个命令在数组中的下标
     */
    async collapseChange(activeNames) {
      console.log("1 折叠面板被激活时候触发: ", activeNames)
      // !=0 表示你是展开折叠面板
      if (activeNames.length != 0) {
        let d = activeNames.split("_")
        console.log("2 折叠面板被激活时候触发 d : ", d)

        // 获取你点击的命令
        this.currentSrcipt = d[0];
        // 数组加下标获取到数组中对应的那个命令对象
        let cTask = this.CurrentTaskList[d[1]]
        console.log("3 折叠面板被激活时候触发 cTask : ", cTask)
        // 你点击折叠面板标题的时候，获取 折叠面板下终端的html
        // 如果 你点击的 折叠面板 表示曾经运行过了终端
        // 并且 折叠面板 对应的 终端 没有html（出现这种情况的原因是因为，你切换了项目导致的）
        if (
          cTask.Terminal != null &&
          !(await this.isHasTerminal())
        ) {
          console.log("4 折叠面板被激活时候触发 cTask.Terminal != null : ", cTask)
          cTask.Terminal = null
          this.newTerminal(cTask)
          this.setContent(cTask.Terminal, cTask.RunLogs)
        }
      } else {
        this.currentSrcipt = activeNames
      }

    },

    // 判断是否有已经终端
    async isHasTerminal() {
      await this.$nextTick()
      let el = document.querySelector(`.${this.projectName}_${this.currentSrcipt}`);
      // 返回 true 表示有终端，false 表示没有
      return el && el.children.length == 0 ? false : true
    },
  },
  computed: {

    // 返回当前项目中的所有script运行命令
    CurrentTaskList() {
      return this.$store.getters.GET_CURRENTTASK(this.projectName)
    },
    // 返回当前你打开的命令
    CurrentTask() {
      return ScriptName => {
        console.log("返回当前你打开的命令 ScriptName: ", ScriptName)
        let curr = this.CurrentTaskList.filter(v => {
          if (v.ScriptName == ScriptName) {
            return v;
          }
        });
        console.log("curr: [] ", curr)
        return curr[0]
      }
    },
    // 返回当前的依赖
    CurrentDependenList() {
      return this.$store.getters.GET_DEPENDENTLIST(this.projectName)
    }
  }
}