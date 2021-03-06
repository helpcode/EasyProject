const {ipcRenderer} = require("electron");

Vue.use(Vuex)

console.log(window)

const store = new Vuex.Store({
  state: {
    loadingService: null,
    ProjectList: [],
    currentVsersion: null, // 保存当前版本号
    isUpdate: false, // 决定 升级弹窗是否显示,
    updateInfo: {}// 如果需要升级，那么这里面保存的就是升级的一些详细信息
  },
  getters: {
    get_vsersion: state => {
      return state.currentVsersion;
    },
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
     try {
       let a = state.ProjectList.find(v => v.FolderName == id)
       return a.TaskRunList;
     } catch (e) {}
    },
    GET_DEPENDENTLIST: (state) => (id) => {
      try {
        let a = state.ProjectList.find(v => v.FolderName == id)
        return a.DependentList;
      } catch (e) {}
    }
  },
  mutations: {
    set_isUpdate(state, status) {
      state.isUpdate = status
    },
    set_updateInfo(state, info) {
      state.updateInfo = info
    },
    set_vsersion(state, vsersion) {
      state.currentVsersion = vsersion
    },
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
      if (data.type == "ChoiceFile") {
        state.ProjectList.push(data.res);
      } else {
        if (data.res) {
          state.ProjectList = data.res;
        }
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
    },
    set_loading(state, intloading) {
      state.loadingService = intloading;
    },
  },
  actions: {
    loading({ commit }, title) {
      let load = ELEMENT.Loading.service({
        text: `${title}..`,
        fullscreen: true
      });
      commit("set_loading", load)
    },
    checkUpdate({ commit }, type) {
      let res = ipcRenderer.sendSync('checkUpdate', {
        action: '检查新版本更新',
      });
      if (res.isUpdate) {
        commit("set_updateInfo", res)
        commit("set_isUpdate", res.isUpdate)
      } else {
        if (type != "default")
        ELEMENT.Notification({
          title: '检查升级',
          message: '已是最新版本，无需升级',
          type: 'warning'
        });
      }
    }
  },
  modules: {}
})

module.exports = store
