import { HomeService } from "@service/Home.service";
import { GET } from "@annotation/Http.annotation";
import { Injectable } from "@annotation/Ioc.annotation";

@Injectable()
export class HomeImplService implements HomeService {
    /**
     * @param params
     * url: 请求地址（可选参数）
     *  1：如果不传，方法名将自动作为请求的地址
     *  2：如果传了，采用传入的地址作为请求地址
     * useHandle: 是否将注解通过ajax获得的数据还给方法（可选参数）
     *  1：如果不传，数据将直接返回给页面的方法调用者，service的方法不需要retrun
     *  2：如果传了，service方法的参数，即是接口的请求参数，在请求完成后将会保存ajax返回结果
     *             所以根据实际业务可以传入true，对ajax返回的数据做一些数据处理，然后再返回给页面使用
     */
    @GET({ useHandle: true })
    public async PlugInfo(params: object): Promise<any> {
        /**
         * useHandle 为 true 的方法会被调用两次，一次是页面调用，params存储的是ajax请求参数
         * 第二次是注解内部调用，params 存储的是ajax请求到的具体数据
         */
        return params
    }
}
