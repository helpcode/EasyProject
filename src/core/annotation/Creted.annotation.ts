import Config from "@config/Index.config";
import Utils from "@utils/Index.utils";
import {Http} from "@net/Http.net";

/**
 * @Ipc()
 * 实现居中IPC的注册，用在controller方法上
 * @param IpcParams 传入需要被注册的ipc类
 * @constructor
 */
export function Ipc(IpcParams: { new (...args: any[]): {}; }[] ) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        /**
         * 因为TS没有提供像java那种可以直接提取某个类中所有方法的系统方法
         * 这边原本使用  Object.getOwnPropertyNames 能够正常提取类中方法，但是如果类中有被 @Inject() 依赖注入的属性
         * 那么这个属性也会被 (new IpcParams())[val]()，这样是肯定报错的，所以做下面约定！
         * 在IPC 类中，如果在类的属性上使用 @Inject() 注入。那么请在类的属性名前加上 _，例如:
         * @Inject()
         * private readonly _Net!: Http;
         */
        IpcParams.forEach((val: { new (): any; } ) => {
            Object.getOwnPropertyNames(val.prototype).splice(1)
                .filter(f => !f.includes("_"))
                .forEach(v => (new val())[v]())
        })
    }
}

/**
 * @CreateApplicationIpc()
 * 实现全局IPC的注册
 * 能够自动实例化传入的类数组中的所有类，并自动调用类中的所有的方法
 * @param IpcParams 类数组，实例：[ classIpc1, classIpc2, classIpc3  ]
 * @constructor
 */
export function CreateApplicationIpc(IpcParams: { new (...args: any[]): {}; }[]): any  {
    return  (_constructor: { new (...args: any[]): {}; } ) => {
        IpcParams.forEach((val: { new (): any; } ) => {
            Object.getOwnPropertyNames(val.prototype).splice(1)
                .filter(f => !f.includes("_"))
                .forEach(v => (new val())[v]())
        })
    }
}

/**
 * @Render()
 * 创建窗口
 * @param templateName 要渲染的模板名称
 * @constructor
 */
export function Render(templateName?: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        /**
         * 如果被打上注解的类中某个方法是配置文件中的默认启动窗口，那么调用这个方法来创建窗体
         * 其他的方法一律不管！由js前端渲染进程触发ipc创建
         */
        if (propertyKey.includes((Config.StartPage.split("/"))[1])) {
            // 如果没有传参数，那么采用方法名来创建窗体！
            templateName == undefined ? Utils.startWindows(target,propertyKey) : Utils.startWindows(target,templateName)
        }
    }
}
