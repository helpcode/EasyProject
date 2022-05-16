const {ipcRenderer} = require("electron");
const router = require("../../assets/js/router/index.js");
const store = require("../../assets/js/store/index.js");
const config = require("../../assets/js/config/index.js");

let Home = new Vue({
  el: '#app',
  router,
  store,
  data: {
    // 左侧菜单的状态 false 非全屏， true 全屏
    menuStatus: false,
    menuIconRotate: 180,
    // 控制重命名项目弹窗是否显示
    isEditDialog: false,
    // 项目图标选择
    isIconDialog: false,

    // 选择主题的下标
    selectThemeIndex: 0,

    // 你点击的项目下标
    clickProjectIndex: -1,

    // 保存 重命名项目 的输入值
    EditProjectName: "",
    // 操作的当前项目 就是 name 名称
    CurrentProjectName: "",

    // 保存用户选择的图片类名
    ProjectIcon: "",
    ProjectListData: [],
    IconList: [
      {icon: '#icon-vue', title: 'Vue'},
      {icon: '#icon-react', title: 'React'},
      {icon: '#icon-angular', title: 'Angular'},
      {icon: '#icon-typescript', title: 'TypeScript'},
      {icon: '#icon-nodejs', title: 'Nodejs'},
      {icon: '#icon-npm1', title: 'Npm'},
      {icon: '#icon-console', title: 'Cli'},
      {icon: '#icon-gulp', title: 'Gulp'},
      {icon: '#icon-graphql', title: 'Graphql'},
      {icon: '#icon-webpack', title: 'Webpack'},
      {icon: '#icon-nuxt', title: 'Nuxt'},
      {icon: '#icon-nest', title: 'Nest'},
    ],
    MoreList: [
      {title: '修改图标', icon: 'el-icon-magic-stick', id: 'editIcon'},
      {title: '重命名项目', icon: 'el-icon-edit', id: 'rename'},
      {title: '移除项目', icon: 'el-icon-delete', id: 'delete'},
    ]
  },
  created() {
    // 调用升级检测
    this.onMainWebContents();
    this.GetProjectList();
  },
  mounted() {
    // this.$store.dispatch('checkUpdate','default')
  },
  methods: {
    downNowDmg(url) {
      ipcRenderer.sendSync('openExternal', {
        action: '浏览器打开',
        url: url,
      });
    },
    // 帮设置页面提前获取当前应用版本号
    changeMenu() {
      if (this.menuStatus) {
        this.menuStatus = false
      } else {
        this.menuStatus = true
      }
    },
    Mouseover(e) {
      console.log("全屏按钮被悬浮")
      if (this.menuStatus) {
        this.menuIconRotate = 0
      } else {
        this.menuIconRotate = 180
      }
    },
    /**
     * 监听主进程发过来的消息
     */
    onMainWebContents() {

      // 主进程发送过来的消息，打开设置页面
      ipcRenderer.on('openSetting', (event, message) => {
        this.$router.push("/setting")
      })

      // 文件被删除
      ipcRenderer.on('DirRemove', (event, arg) => {
        console.log("检测到您的文件路径发生变化: ", arg)
        ipcRenderer.send('removeListProject', {
          action: '从列表移除',
          name: arg.name,
        });
        this.removeProjectItem("autoWatch", arg.FolderName);
        // this.$confirm(`该路径下文件：${arg.Fullpath} 发生变化，即将移除项目！`, '提示', {
        //   confirmButtonText: '确定',
        //   cancelButtonText: '取消',
        //   type: 'error'
        // }).then(() => {
        //
        // }).catch(() => {
        // });
      })

      // 使用 touchbar导入项目
      ipcRenderer.on('TouchBarImportProject', (event, message) => {
        if (message != undefined) {
          this.$store.commit('SET_LIST', {
            res: message,
            type: 'ChoiceFile'
          });
        }
      })

      let result = ipcRenderer.sendSync('getVersion', {
        action: '获取设置页面的当前版本号'
      });
      this.$store.commit('set_vsersion', result.version);

      let res = ipcRenderer.sendSync('getSettingConfig', {
        action: '获取设置页面配置参数'
      });

      // 把从json数据库中获取到的配置向 vuex 中合并
      this.$store.replaceState(Object.assign({}, this.$store.state, res))
      console.log("设置的参数：", this.$store.state)

    },
    openInfo(v, i) {
      this.clickProjectIndex = i;
      this.$router.push({
        name: 'info',
        query: {
          name: v.FolderName,
          active: v.CurrentTabs,
          isNeedWatch: true
        }
      })
    },
    /**
     * 项目列表 悬浮下拉项被点击
     * @constructor
     */
    ShowActionClick(item) {
      console.log("item: ", item)
      // 保存当前操作的项目文件夹名称
      this.CurrentProjectName = item[0]

      switch (item[1]) {
        case "delete": // 移除项目
          this.$confirm('【从磁盘删除】将会从电脑上删除您的项目，【从列表移除】将从项目列表删除选中的项目。', '移除项目', {
            distinguishCancelAndClose: true,
            confirmButtonText: '从列表移除',
            cancelButtonText: '从磁盘删除',
            roundButton: true,
            type: 'warning'
          }).then(() => {
            ipcRenderer.send('removeListProject', {
              action: '从列表移除',
              name: this.CurrentProjectName,
            });
            this.removeProjectItem();
          }).catch((action) => {
            if (action == "cancel") {
              this.$confirm('项目将会被删除到【废纸篓】，确定继续？', '删除提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'error'
              }).then(() => {
                let status = ipcRenderer.sendSync('removeDistProject', {
                  action: '从磁盘删除',
                  name: this.CurrentProjectName,
                });
                if (status == "success") {
                  this.$notify({title: '提示', message: '项目删除成功', type: 'success'});
                } else {
                  this.$notify.error({title: '提示', message: status, type: 'error'});
                }
                this.removeProjectItem();
              }).catch(() => {
              });
            }
          });
          break;
        case "rename": // 重命名项目
          this.isEditDialog = true;
          break;
        case "editIcon": // 修改图标
          this.isIconDialog = true;
          break;
      }
    },

    /**
     *  从列表删除  和 从 磁盘删除，需要减少列表数据
     * @param type
     *           default 表示从 列表 和 磁盘进行删除
     *           autoWatch 表示检测到的自动删除
     * @param condition autoWatch 的筛选条件
     */
    removeProjectItem(type = "default", condition) {
      // 从原数组中去除你要删除的
      let list = this.$store.getters.GET_PROJECT.filter((v, i) => {
        if (type == "default") {
          if (i != this.clickProjectIndex) {
            return v;
          }
        } else {
          if (v.FolderName != condition) {
            return v;
          } else {
            // 将你当前移动文件位置的项目路径保存起来，为下面自动激活做准备
            this.clickProjectIndex = i
          }
        }
      });

      this.$store.commit('SET_LIST', {
        res: list,
        type: "ProjectList"
      })

      // 当前项目被你删除，自动跳转激活到上一个项目
      // 处理越界
      let index = this.clickProjectIndex - 1;
      index < 0 ? index = 0 : index - 1

      // 如果所有项目都被删完了，调回 main 主页
      list.length == 0
        ? this.$router.replace("/main")
        : this.openInfo(
          this.$store.getters.GET_PROJECT[index],
          index
        )
    },

    /**
     * 选择图标
     * @param item
     * @constructor
     */
    SelectIcon(item) {
      this.$store.getters.GET_PROJECT[this.clickProjectIndex].FolderIcon = item.icon
      let status = ipcRenderer.sendSync('ChangeIcon', {
        action: '修改项目图标',
        name: this.CurrentProjectName,
        newIcon: item.icon
      });

      if (status == "success") {
        this.isIconDialog = false;
      }
    },

    /**
     * 重命名项目
     * @constructor
     */
    SubmitEdit() {
      if (this.EditProjectName.length != 0) {
        this.$store.getters.GET_PROJECT[this.clickProjectIndex].name = this.EditProjectName
        let status = ipcRenderer.sendSync('reNameProject', {
          action: '重命名项目',
          oldName: this.CurrentProjectName,
          newName: this.EditProjectName
        });
        if (status == "success") {
          this.EditProjectName = ""
          this.isEditDialog = false;
        }
      }
    },

    OpenPropject(type, item) {
      console.log(item)
      ipcRenderer.sendSync('OpenProject', {
        action: '选择项目',
        type: type,
        path: item.Fullpath
      });
    },
    /**
     * 添加项目 按钮被点击，弹窗选择文件
     * @constructor
     */
    ChoiceFile() {
      let list = ipcRenderer.sendSync('openDirectory', {
        action: '选择项目'
      })
      if (list != undefined) {
        console.log("导入项目：", list)
        this.$store.commit('SET_LIST', {
          res: list,
          type: 'ChoiceFile'
        });
      }
    },

    /**
     * 获取项目列表
     * @constructor
     */
    GetProjectList() {
      let list = ipcRenderer.sendSync('ProjectList', {
        action: '获取默认列表'
      });
      console.log("GetProjectList ==== ", list)
      // 如果没有项目列表了，那么就不需要展示项目详情页面
      list.length == 0 ? this.$router.push("/") : ""
      // 请求到的数据存入vuex中
      this.$store.commit('SET_LIST', {
        res: list,
        type: "ProjectList"
      })
    },
  },
  computed: {
    key() {
      return this.$route.name ? this.$route.name + +new Date() : this.$route + +new Date()
    }
  }
});
