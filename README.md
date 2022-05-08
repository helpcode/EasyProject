## electronTs

> 这个项目大致作用就是：前端有 electron-vue，那熟悉 nodejs，typescript 的同学也是时候该有个能开箱即用的electron框架了，项目正在开发完善中，请保持每天多次拉取代码的习惯！

需要一说的是这个项目开发了大量的装饰器做到了代码的编写风格优雅化和定制化，同时也更加类似java的springboot框架，更采用了约定大于配置的原则，所以也要求阅读代码的同学对ts的掌握度稍微高点！！同时更加详细的使用文档还没时间写，下面的文档将就看看，主要还是推荐看代码，代码里面基本有详细的注释！

忘记说了，本项目基于：nodejs，typescript，electron，jade，gulp.js，less，typescript 装饰器等实现！！

## 1：项目结构说明

这边重点介绍`src/`目录，因为`src/`才是我们项目开发的源码目录！而`dist/`目录是项目上线后使用的。所以不关心！！

```text
|-src
|____core    核心TS逻辑的源码
| |____types 一些自动以的类型声明
| |____net   网络请求的封装
| |____config 项目的整体配置文件
| |____annotation 存放自定义装饰器
| |____utils   项目的工具函数
| |____controller 项目的控制器，主要在这里控制页面的显示，记住每个桌面端页面都是一个控制器！
| |____model    Typescript的存取器，这里主要存放当前启动主窗口的实例
| |____interactive  各种系统界面的ui，例如菜单，弹窗，进度条，图标等
| |____ipc    渲染进程和主进程的ipc监听
| | |____application.ipc.ts  程序系统核心级别的ipc监听
| | |____components.ipc.ts   具体到默写页面级别的ipc监听
| |____run   程序真正的入口启动类
|____App.ts  程序的开始类，主要初始化 run
|____application  应用程序页面
| |____page    每个controller都对应这里的一个页面
| |____layout  页面的公共布局
| |____components 存放页面的公共复用组件
| |____assets   静态资源
| | |____less   css样式
| | |____js     
| | | |____page 这里存放对应page页面的js
| | | |____lib  存放js公共库，例如jquery等
| | |____img    存放图片
```

## 2：源码分析

### 2.1：核心装饰器间调用思路

- 第一步：`Init.run.ts` 中 `@AutoLoadWindow()` 装饰器首先被运行，然后会自动加载启动类`Home.controller.ts`

- 第二步：这一步首先运行类属性上的装饰器`@Inject()`，`@Inject()`会去实例化被装饰属性的类型，赋值给被装饰的属性！

- 第三步：`@Inject()`运行完后，会紧接着运行类的方法上的装饰器，先后顺序为：`@Render()` 和 `@Ipc()`，但是实际运行的效果却是 `@Ipc()` 在 `@Render()`之前，主要原因是`@Render()`中有`await`导致的，这其中`@Render()`是最核心的装饰器之一。主要作用是：获取方法传给模板的数据，根据`jade`模板&数据生成`html`页面，载入`html`然后创建窗口！
  
- 第四步：前面三步走完后，用户已经可以看到窗口了，而`@Ipc()`装饰器的主要作用在于自动调用传入类中的所有方法实现`ipc`监听。

**注意：当然上面的步骤只是核心装饰器的运行流程，还有很多其他装饰器也是同步执行的，这里没详细介绍！可以阅读源码~~**

### 2.2：渲染进程创建窗口思路

- 1：`Init.run.ts`类上有个装饰器`@CreateApplicationIpc()`，该装饰器也继承`Run`类，之后内部实例化`ApplicationIpc()`类，这其中会通过` ipcMain.on`去监听前端的事件`openWindow`。
- 2：创建窗口分为三种情况
    - 1：独立窗口
    - 2：依附在主窗口上的父子窗口
    - 3：依附在非主窗口上的父子窗口
- 3：前端`js`通过使用：`ipcRenderer.sendSync('openWindow', ['Home.controller/Setting', true])` 发起通知，让主进程创建窗口！这其中参数：`Home.controller/Setting`，表示调用`Home.controller.ts`里面的`Setting`方法创建窗口！

### 2.3：已提供的装饰器

- @AutoLoadWindow()  
  - 作用：根据配置文件自动引入主controller文件
  - 使用：仅限启动类`Run`
  - 参数：无
  - 注意：无
  
- @Render(templateName?:string)
  - 作用：根据配置文件自动创建窗口
  - 使用：用在`controller/` 文件夹下的控制器类方法中
  - 参数：templateName：要渲染的模板名称（选填）
    - 未填写参数：自动使用被装饰的方法名去寻找路径`src/application/page/**/*.jade`路径下的模块文件，并自动读取`Index.config.ts`对应的`PageSize`和`PagePath`
    - 已填写参数：同上，只不过使用传入的名称去寻找模板和配置文件等信息
  - 注意：被装饰的方法的名字需要和模板名称，配置文件中`PageSize`和`PagePath`都相同！！！
  
- @Ipc(IpcParams: { new (...args: any[]): {}; }[])
  - 作用：自动注册窗口相关的局部 IPC
  - 使用：用在`controller/` 文件夹下的控制器类方法中
  - 参数：IpcParams：需要被注册的未实例化的类数组
  - 注意：参数必须填写未实例化的类，构成数组，例如：`@Ipc([ Application, TestIpc ])`
  
- @CreateIpc(IpcParams: { new (...args: any[]): {}; }[])
  - 作用：自动注册程序公共的全局 IPC
  - 使用：仅限启动类Run
  - 参数：IpcParams：需要被注册的未实例化的类数组
  - 注意：参数必须填写未实例化的类，构成数组，例如：`@CreateApplicationIpc([ Application, TestIpc ])`

- @Injectable()
  - 作用：依赖收集，主要用来存储被装饰的类到存取器
  - 使用：用在类上
  - 参数：无
  - 注意：和 `@Inject()` 搭配使用
  
- @Inject()
  - 作用：依赖注入，将`@Injectable()`中存的类取出并实例化到类属性上
  - 使用：用在类的属性上
  - 参数：无
  - 注意：和 `@Injectable()` 搭配使用  
  
- @GET(RequestParams?: { url?: string, useHandle?: boolean })
  - 作用：发送`GET`请求
  - 使用：用在`service`层类的方法上
  - 参数：
    - url：如果不传参数将自动依据方法名作为对象的key去寻找`Config.ApiUrl.ApiList[方法名]`的接口地址，如果传参数，使用传入的参数作为接口请求地址
    - useHandle：如果接口返回的数据需要做特殊处理，那么可以设置 `useHandle`为`true`，中间被`@GET`注解的方法将会获得ajax请求的结果，如果为`flase`方法将不会获得任何参数！
  - 注意：不填写参数时，请保持方法名和 `Config.ApiUrl.ApiList[key]`中的key名称一致！！
  
- 【设计中..】@POST(RequestParams?: string)
  - 作用：暂无描述
  - 使用：暂无描述
  - 参数：暂无描述
  - 注意：暂无描述

- 【设计中..】@DELETE(RequestParams?: string)
  - 作用：暂无描述
  - 使用：暂无描述
  - 参数：暂无描述
  - 注意：暂无描述
  
- 【设计中..】@PUT(RequestParams?: string)
  - 作用：暂无描述
  - 使用：暂无描述
  - 参数：暂无描述
  - 注意：暂无描述
  
- @CreateApplicationMenu()
  - 作用：创建程序的顶部菜单！
  - 使用：仅限启动类`Run`
  - 参数：无
  - 注意：无
  
- @CreateTouchbar()
  - 作用：创建`MacOs`系统上的`Touchbar`！
  - 使用：仅限启动类`Run`
  - 参数：无
  - 注意：仅限`MacOs`系统有效，如果是`windows`可删除该装饰器
  
- @CreateTray()
  - 作用：创建`MacOs`系统上顶部全局菜单的图标！
  - 使用：仅限启动类`Run`
  - 参数：无
  - 注意：仅限`MacOs`系统有效，如果是`windows`可删除该装饰器


**更多的请自行阅读源码！！**

## 3：注意事项

### 3.1 解决下载electron缓慢的问题！
 
~~在项目初始的时候`npm i`，`node`会去下载`electron`，因为被墙的原因你可能需要四五个小时都不一定能把`electron`依赖下载完成。所以请自行参考这篇文章手动修改，跳过程序的`node install.js`的过程，加快速度！！~~

~~教程地址：[假装这里有链接](假装这里有链接)~~

---

**PS：如果上面的方案不能解决你的问题（亲测无效），那么请先删除项目的`node_modules`依赖，然后重新 `npm i`，当看到终端在下载`electron`的时候，请强制停止终端。然后从这个地址:**

> [https://npm.taobao.org/mirrors/electron/](https://npm.taobao.org/mirrors/electron/)

下载对应你系统的`electron`包。

**MacOs系统**

我这边下载的是`Macos`系统的`9.1.0`最新版`electron`，文件名：`electron-v9.1.0-darwin-x64.zip`。

下载完成后解压压缩包，然后将文件夹中的`Electron.app`复制到`应用程序`中，然后修改`package.json`中的命令`el`为`/Applications/Electron.app/Contents/MacOS/Electron .`
即可！！

示例配置文件为：
```json
  "scripts": {
    "el": "/Applications/Electron.app/Contents/MacOS/Electron ."
  }
```

**Windows系统**

如果你是`Windows`系统，那么你可以下载 [electron-v9.1.0-win32-x64.zip](https://npm.taobao.org/mirrors/electron/9.1.0/electron-v9.1.0-win32-x64.zip) 的包！也是解压然后将解压后的文件移动到没有中文名和空格的路径中，然后使用`electron.exe`去运行项目即可！

示例配置文件为：
```json
  "scripts": {
    "el": "C:\\electron-v9.1.0-win32-x64\\electron.exe ."
  }
```

### 3.2 修改jade插件

因为 `jade` 插件支持的参数 `globals` 只支持数组！所在再把`config/Index.config.ts`中的`jadeCompile0ptions`传给模板`application/layout/index.jade`的时候不好分开遍历`css`和`js`。

所以需要修改`globals`的数组为对象：

- 修改后的效果如下：

```typescript
// jade 模板引擎配置，更多参数自行阅读声明文件
public static jadeCompile0ptions: JadeOptions = {
    pretty: true, // 编译输出后是否保留源码格式，true 保持
    globals: {
        css: [
            'http://mdui-aliyun.cdn.w3cbus.com/source/dist/css/mdui.min.css',
            'http://at.alicdn.com/t/font_1934749_6mfzbfby21d.css',
        ],
        js: [
            'https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.js',
            'http://mdui-aliyun.cdn.w3cbus.com/source/dist/js/mdui.min.js'
        ]
    }
}
```

修改步骤

1：打开文件：`node_modules/@types/jade/index.d.ts`，找到接口`JadeOptions`，修改原先的`globals`为下面类型：

```typescript
...
globals?: {
    css: string[],
    js: string[]
};
...
```

2：打开文件：`node_modules/jade/lib/index.js`，找到第`133`行 ~ `141`行，注释这些代码即可。实例如下：

```typescript
...
 var globals = [];

// 下面这些注释掉
// if (options.globals) {
//   globals = options.globals.slice();
// }

// globals.push('jade');
// globals.push('jade_mixins');
// globals.push('jade_interp');
// globals.push('jade_debug');
// globals.push('buf');
// 上面这些注释掉

  var body = ''
...
```

重新运行项目即可！！
