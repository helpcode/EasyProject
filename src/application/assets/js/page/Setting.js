const {ipcRenderer,app} = require("electron");


module.exports = {
  data() {
    return {
      isShowDialog: false,
      visible: false,
      networkURL: '',
      slider0pacity: '',
      typeText: this.$store.state.packageType[this.$store.state.packageTypeSelect],
      custom: {
        type: "img",
        text: "",
        BgColor: "#000000",
        textColor: "#ffffff",
        activeBgColor: "#000000",
        system: true
      },
    }
  },
  created() {
  },
  methods: {
    // 重新选择nodejs的路径
    selectEnvPath() {
      ipcRenderer.send('selectEnvPath', {
        action: '重新选择nodejs的路径'
      });
    },
    TypeChange(index) {
      this.$store.state.packageTypeSelect = index
      ipcRenderer.send('setPackageTypeindex', {
        action: '更新你选择的包管理工具',
        keyName: "packageTypeSelect",
        value: index
      });
    },
    // 开启透明度 的  checkbox 被选择的时候
    openChange(val) {
      ipcRenderer.send('setSettingConfig', {
        action: '更新 checkbox 是否开启透明度的开关',
        keyName: "mask.open",
        value: val
      });
    },

    // slider 滑动的时候 改变 body 上的 style
    change(e) {
      ipcRenderer.send('setSettingConfig', {
        action: '更新 透明的的数值',
        keyName: e == "opacity"
                   ? "mask.opacity"
                   : "mask.blur"
        ,
        value: e == "opacity"
          ? this.$store.state.mask.opacity
          : this.$store.state.mask.blur
      });

      // 因为 --fill-color 这种方式需要通过style把颜色变量定义在父组件上
      // 然后 子组件 使用变量，而这边 el-slider 组件的数值提示 tooltip 框
      // 在 body 下，所以这边为 body 加 --fill-color
      let body = document.querySelector("body")
      body.style = `--fill-color: ${
        this.$store.getters.get_list[this.$store.getters.get_theme].type == 'color'
          ? `${this.$store.getters.get_list[this.$store.getters.get_theme].BgColor}`
          : `${this.$store.getters.get_list[this.$store.getters.get_theme].activeBgColor}`
      }`
    },

    // 格式化选中的 透明度 数值
    formatTooltip(val) {
      return val / 10;
    },

    // 网络图片输入框被输入的时候触发
    networkChange(value) {
      if (value.length == 0 || !value.includes("http")) {
        return false;
      }
      this.visible = false;
      this.networkURL = ""
      this.custom.BgColor = value;
      this.custom.text = "网络图片";
    },

    // 删除主题
    deleteTheme(item, index) {
      console.log("item: ", item)
      console.log("index: ", index)
      console.log("index - 1: ", index - 1)

      // 如果当前主题正是你点击要删除的主题
      if (this.$store.getters.get_theme == index) {
        // 那么设置当前主题为你点击主题的上一个
        this.changeTheme(index - 1);
      }

      // 删除你点击的主题
      this.$store.commit("set_themeList", this.$store.getters.get_list.filter(v => {
        if (v.BgColor != item.BgColor) {
          return v
        }
      }));
      ipcRenderer.send('delete_themeList', {
        action: '删除你点击的主题',
        keyName: "list",
        value: item
      });
      // this.$store.commit("push_themeList", this.$store.getters.get_list)
    },

    // 完成选择
    completeSelection() {
      if (/^#/.test(this.custom.BgColor)) {
        this.$notify({
          title: '提示',
          duration: 2000,
          type: 'warning',
          message: '请上传图片！'
        });
        return false;
      }

      // 深拷贝一下，不能直接改变 BgColor，要不然BgColor变了页面上的图片无法显示
      let color = JSON.parse(JSON.stringify(this.custom))
      color.BgColor = `url("${color.BgColor}")`;
      this.$store.commit("push_themeList", color)
      this.resetCustom()
      this.isShowDialog = false;
    },

    // 重新选图
    reselect() {
      this.custom.text = ""
      this.custom.BgColor = "#000000"
      this.custom.textColor = "#ffffff"
      this.custom.activeBgColor = "#000000"
    },

    // 选择上传文件
    uploadFile(e) {
      let file = e.target.files[0];
      this.custom.text = file.name.split(".")[0];
      this.custom.BgColor = file.path;
      console.log(this.custom)
    },

    // 是否开机自启
    changeIsOpen(status) {
      this.$store.commit("set_isOpen", status)
      ipcRenderer.send('setSettingConfig', {
        action: '更新设置',
        keyName: "isOpen",
        value: status
      });
    },

    // 点击切换主题
    changeTheme(index) {
      this.$store.commit('set_themeIndex', index)
      ipcRenderer.send('setSettingConfig', {
        action: '更新设置选中的主题下标',
        keyName: "selectThemeIndex",
        value: index
      });
      // 每次点击切换主题，同时修改body
      this.change()
    },

    // 重置样式的变量
    resetCustom() {
      this.custom = {
        type: "img",
        text: "",
        BgColor: "#000000",
        textColor: "#ffffff",
        activeBgColor: "#000000",
        system: true
      }
    }
  }
}