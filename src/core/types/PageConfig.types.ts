import { BrowserWindowConstructorOptions } from "electron";

export interface PagePath {
  Welcome?: String,
  Home?: String,
  PlugInfo?: String
}

export interface PageSize {
  // 欢迎页面 窗体的配置
  Welcome?: BrowserWindowConstructorOptions,
  Home?: BrowserWindowConstructorOptions,
  PlugInfo?: BrowserWindowConstructorOptions
}
