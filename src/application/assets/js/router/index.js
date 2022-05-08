const Utils = require("../Utils/index.js");

const routes = [
  {
    path: '/',
    redirect: {
      name: 'main'
    },
    meta: {
      keepAlive: false
    }
  },
  {
    path: '/main',
    name: 'main',
    component: {
      template: Utils.Html("/Home/Main.html"),
      ...require("../page/Main.js")
    },
    meta: {
      keepAlive: false
    }
  },
  {
    path: '/info',
    name: 'info',
    component: {
      template: Utils.Html("/Home/ProjectInfo.html"),
      ...require("../page/ProjectInfo.js")
    },
    meta: {
      keepAlive: true
    }
  },
  {
    path: '/setting',
    name: 'setting',
    component: {
      template: Utils.Html("/Setting/Setting.html"),
      ...require("../page/Setting.js")
    },
    meta: {
      keepAlive: true
    }
  }
];

const router = new VueRouter({
  routes
})

module.exports = router