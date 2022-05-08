const { ipcRenderer } = require('electron');
let Welcome = new Vue({
  el: '#app',
  data: {
    msg: '测试'
  },
  methods: {
    OpenHome () {
      ipcRenderer.send('openWindow', {
        action: 'Home.controller/Home',
        closeParent: true,
        data: {}
      });
    }
  }
});
