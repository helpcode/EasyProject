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

    clickProjectIndex: -1,

    // 保存 重命名项目 的输入值
    EditProjectName: "",
    // 操作的当前项目
    CurrentProjectName: "",

    // 保存用户选择的图片类名
    ProjectIcon: "",
    ProjectListData: [],
    IconList: [
      { icon: '#icon-vue', title: 'Vue' },
      { icon: '#icon-react', title: 'React' },
      { icon: '#icon-angular', title: 'Angular' },
      { icon: '#icon-typescript', title: 'TypeScript' },
      { icon: '#icon-nodejs', title: 'Nodejs' },
      { icon: '#icon-npm1', title: 'Npm' },
      { icon: '#icon-console', title: 'Cli' },
      { icon: '#icon-gulp', title: 'Gulp' },
      { icon: '#icon-graphql', title: 'Graphql' },
      { icon: '#icon-webpack', title: 'Webpack' },
      { icon: '#icon-nuxt', title: 'Nuxt' },
      { icon: '#icon-nest', title: 'Nest' },
    ],
    MoreList: [
      { title: '修改图标', icon: 'el-icon-magic-stick', id: 'editIcon' },
      { title: '重命名项目', icon: 'el-icon-edit', id: 'rename' },
      { title: '移除项目', icon: 'el-icon-delete', id: 'delete' },
    ]
  },
  created() {
    this.onMainWebContents();
    this.GetProjectList()
  },
  mounted() {
  },
  methods: {
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
      // 打开设置页面
      ipcRenderer.on('openSetting', (event, message) => {
        this.$router.push("/setting")
      })

      let res = ipcRenderer.sendSync('getSettingConfig', {
        action: '获取设置页面配置参数'
      });

      // 把从json数据库中获取到的配置向 vuex 中合并
      this.$store.replaceState(Object.assign({},this.$store.state,res))

      console.log("设置页面参数为：", this.$store.state)

    },
    openInfo(v,i) {
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
            ipcRenderer.sendSync('removeListProject', {
              action: '从列表移除',
              name: this.CurrentProjectName,
            });
            this.GetProjectList()
          }).catch((action) => {
            if (action == "cancel") {
              this.$confirm('此操作将永久删除项目，您确定进行此操作？', '删除提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'error'
              }).then(() => {
                let status = ipcRenderer.sendSync('removeDistProject', {
                  action: '从磁盘删除',
                  name: this.CurrentProjectName,
                });
                if (status == "success") {
                  this.$notify({ title: '提示', message: '项目已从磁盘移除成功', type: 'success' });
                } else {
                  this.$notify.error({ title: '提示', message: status, type: 'error' });
                }
                this.GetProjectList()
              }).catch(() => {});
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
     * 选择图标
     * @param item
     * @constructor
     */
    SelectIcon(item) {
      let status = ipcRenderer.sendSync('ChangeIcon', {
        action: '修改项目图标',
        name: this.CurrentProjectName,
        newIcon: item.icon
      });
      if (status == "success") {
        this.isIconDialog = false;
        this.GetProjectList()
      }
    },

    /**
     * 重命名项目
     * @constructor
     */
    SubmitEdit() {
      if (this.EditProjectName.length != 0) {
        let status = ipcRenderer.sendSync('reNameProject', {
          action: '重命名项目',
          oldName: this.CurrentProjectName,
          newName: this.EditProjectName
        });
        if (status == "success") {
          this.isEditDialog = false;
          this.GetProjectList()
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
      this.$store.commit('SET_LIST', ipcRenderer.sendSync('openDirectory', {
        action: '选择项目'
      }))
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
      this.$store.commit('SET_LIST', list)
    },
  },
  computed: {
    key() {
      return this.$route.name ? this.$route.name + +new Date() : this.$route + +new Date()
    }
  }
});
