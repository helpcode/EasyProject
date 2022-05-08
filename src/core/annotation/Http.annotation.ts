import Config from "@config/Index.config";
import {Http} from "@net/Http.net";

/**
 * @GET()
 * 用在service类的方法上。
 * 如果不传参数将自动根据方法名获取接口请求的地址
 * 如果传参了，那么使用用户传入的地址去发送网络请求
 *
 * 如果 useHandle 为 true 那么方法将获得ajax请求的数据
 * 否则 不会将数据给方法
 * @param RequestParams
 * @constructor
 */
export function GET (RequestParams?: { url?: string, useHandle?: boolean, header?: { [index: string]: any } }) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let url: string = Config.ApiUrl.ApiList[propertyKey],
            handle: boolean = false,
            header: object = {};

        (RequestParams && RequestParams.url)
            ? url = RequestParams.url
            : (RequestParams && RequestParams.useHandle)
                ? handle = RequestParams.useHandle
                : (RequestParams && RequestParams.header)
                    ? header = RequestParams.header
                    : '';

        let OldMethods = descriptor.value;
        if (handle) {
            descriptor.value = async (data: { [key:string]: any }) =>
                await OldMethods.apply(target, [ await (new Http).GET({ url: url, data: data, header: header }) ])
            return descriptor
        } else {
            descriptor.value = async (data: { [key:string]: any }) =>
                await (new Http).GET({ url: url, data: data, header: header })
            return descriptor
        }
    }
}
