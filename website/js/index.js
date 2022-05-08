class Index {
  constructor() {
    // 下载地址
    this.newDownUrl = ""
    // this.getLatestReleases();
    this.initWow();
  }

  async initWow() {
    new WOW({
      boxClass:     'wow',      // 需要执行动画的元素的类名
      animateClass: 'animate__animated', // animation.css 动画类名
      offset:       0,          // 设置滚动触发动画的距离（相对于底部）
      mobile:       true,       // 是否在移动设备执行动画
      live:         true        // 异步加载的内容持续检测
    }).init();
  }

  downApp() {
    this.$(".down").onclick = () => {
      open(this.newDownUrl)
    }
  }

  async getLatestReleases() {
    let data = await fetch("https://api.github.com/repos/helpcode/EasyProject/releases/latest");
    let res = await data.json();
    this.newDownUrl = res.assets[0].browser_download_url;
    this.downApp();
  }

  $ (className) {
    return document.querySelector(className)
  }
}

new Index();