import Utils from "@utils/Index.utils";
import {ApplicationMenu} from "@interactive/ApplicationMenu.interactive";

export function StartWindow(): any {
    return  (_constructor: {new(...args:any[]):{}} ) => {
        return class extends _constructor {
            constructor() {
                // 这里只要动态 require 导入类即可，然后类上的装饰器就会运行
                Utils.GetController()
                // 创建顶部菜单
                new ApplicationMenu()
                super();
            }
        }
    }
}