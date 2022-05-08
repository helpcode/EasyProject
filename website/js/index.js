class Index {
  constructor() {
    this.initWow();
  }

  async initWow() {
    var result = await fetch("https://api.github.com/repos/electron/electron/releases/latest");
    console.log("result: ", await result.json())

    new WOW({
      boxClass:     'wow',      // 需要执行动画的元素的类名
      animateClass: 'animate__animated', // animation.css 动画类名
      offset:       0,          // 设置滚动触发动画的距离（相对于底部）
      mobile:       true,       // 是否在移动设备执行动画
      live:         true        // 异步加载的内容持续检测
    }).init();
  }
}

new Index();