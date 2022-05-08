const {readFileSync} = require("fs");
const {join, resolve} = require("path");
const amdLoader = require('monaco-editor/min/vs/loader.js');

class Utils {

  // 保存 require 对象
  #amdRequire = amdLoader.require;
  #module = null;
  #themeData = null;

  constructor() {
    // 使用插件 monaco-themes 里面提供的json配置文件
    // this.#themeData = require("monaco-themes/themes/GitHub.json")
    this.#amdRequire.config({
      baseUrl: this.uriFromPath(join(__dirname, '../../../../../node_modules/monaco-editor/min'))
    });

    // 设置中文语言
    this.#amdRequire.config({
      'vs/nls': { availableLanguages: {'*':'zh-cn'}}
    });
  }

  uriFromPath(_path) {
    var pathName = resolve(_path).replace(/\\/g, '/');
    if (pathName.length > 0 && pathName.charAt(0) !== '/') {
      pathName = '/' + pathName;
    }
    return encodeURI('file://' + pathName);
  }

  Html(path) {
    return readFileSync(join(__dirname, `../../../page${path}`)).toString("utf-8")
  }

  initVscodeEdit() {
    return new Promise((success, error) => {
      this.module = undefined;
      this.#amdRequire(['vs/editor/editor.main'], () => {
        // 自定义主题
        // monaco.editor.defineTheme('mytheme', this.#themeData);
        // monaco.editor.setTheme('mytheme');
        let el = document.querySelector(".package");

        // 当切换tabs的时候清空上一个项目的package.json配置
        el.innerHTML = ""
        var editor = monaco.editor.create(
          el,
          {
            value: '',
            language: 'json',
            autoIndent: true,
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            fontSize: "16px",
            scrollBeyondLastColumn: 2,
            automaticLayout: true
          }
        );
        success(editor)
      });
    })
  }

}

module.exports = new Utils();