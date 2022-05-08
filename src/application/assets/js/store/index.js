const {ipcRenderer} = require("electron");

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    ProjectList: [],
  },
  getters: {
    get_isOpen: state => {
      return state.isOpen;
    },
    get_list: state => {
      return state.list;
    },
    get_theme: state => {
      return state.selectThemeIndex;
    },
    GET_PROJECT: state => {
      return state.ProjectList
    },
    GET_CURRENTSCRIPT: (state) => (projectName, currentScript) => {
      console.log(projectName, currentScript)
      let a = state.ProjectList.find(v => v.FolderName == projectName);
      console.log(a.TaskRunList.find(v => v.ScriptName = currentScript))
    },
    GET_CURRENTTASK: (state) => (id) => {
      let a = state.ProjectList.find(v => v.FolderName == id)
      return a.TaskRunList;
    },
    GET_DEPENDENTLIST: (state) => (id) => {
      let a = state.ProjectList.find(v => v.FolderName == id)
      return a.DependentList;
    }
  },
  mutations: {
    set_isOpen(state, status) {
      state.isOpen = status
    },
    set_themeIndex(state, index) {
      state.selectThemeIndex = index;
    },
    // 向主题数组里面追加用户新增的样式
    push_themeList(state, data) {
      state.list.push(data)
      // 将用户自定义的配置保存到json数据库
      ipcRenderer.send('push_themeList', {
        action: '保存自定义主题配置',
        keyName: "list",
        value: data
      });
    },
    set_themeList(state, data) {
      state.list = data;
    },
    // 保存项目的数据
    SET_LIST(state, data) {
      if (data) {
        state.ProjectList = data;
      }
    },
    // 进入详情页后，点击 任务，将从后端获取到的项目script命令
    // 数据保存到对应 ProjectList 中
    SET_TASKRUNLIST(state, params) {
      state.ProjectList.forEach(v => {
        if (v.FolderName == params.id) {
          // v.TaskRunList.forEach(j => {
          //   if (j.Terminal != null)
          // })
          v.TaskRunList = params.TaskRunList
        }
      });
    },
    SET_DEPENDENTLIST(state, params) {
      state.ProjectList.forEach(v => {
        if (v.FolderName == params.id) {
          v.DependentList = params.DependentList
        }
      });
    },
    // 修改 ProjectList 中的激活tabs
    SET_CURRENTTABS(state, params) {
      state.ProjectList.forEach(v => {
        if (v.FolderName == params.id) {
          v.CurrentTabs = params.currentTabs
        }
      })
    }
  },
  actions: {},
  modules: {}
})

module.exports = store
