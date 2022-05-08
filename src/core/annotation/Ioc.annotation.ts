import 'reflect-metadata';
import IocModel from "@model/Ioc.model";

/**
 * 收集类依赖
 * @constructor
 */
export function Injectable() {
    return (_constructor:  { new (...args: any[]): {}; }) => {
        if(IocModel.classPool.indexOf(_constructor) !== -1) {
            throw new Error('无需重复收集类');
        } else {
            //注册
            IocModel.classPool = [_constructor]
        }
    }
}

/**
 * 将类依赖实例化然后注入到被装饰的属性中
 * @constructor
 */
export function Inject() {
    return function (target: any, propertyName: string) {
        /**
         * 使用 reflect-metadata 提供的内置 类型元数据键 design:type 通过反射拿到被装饰属性的类型
         * 也就是 类属性要实例化 的 service 类
         */
        const propertyType: any = Reflect.getMetadata('design:type', target, propertyName);
        if (IocModel.classPool.indexOf(propertyType) == -1) {
            throw new Error('被装饰的属性所属的变量类型类，没有被装饰器@Injectable()注入，请检查！');
        } else {
            // 从存取器的数组中通过下标取出被装饰属性对应的service类，然后实例化这个类，在放入被装饰的属性中
            target[propertyName] = new (IocModel.classPool[IocModel.classPool.indexOf(propertyType)])()
        }
    }
}
