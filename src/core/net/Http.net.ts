import Config from "@config/Index.config";
import {Inject, Injectable } from "@annotation/Ioc.annotation";
import { LogsUtils } from '@utils/logs.utils';
import Axios, { AxiosResponse } from "axios";
import Utils from "@utils/Index.utils";

interface RequestParams {
    url: string,
    custom?: string,
    data?: { [index: string]: any; },
    header?: { [index: string]: any }
}

@Injectable()
export class Http {

    private ResponseData!: AxiosResponse<any>;

    constructor() {
        Axios.defaults.baseURL = Utils.CheckAjaxUrl();
    }

    @Inject()
    private LogsUtils!: LogsUtils;

    /**
     * GET请求
     * @param params
     * @constructor
     */
    public async GET(params: RequestParams): Promise<any> {
        console.log("GET params: ", params)
        if (params.custom !== undefined) {
            Axios.defaults.baseURL = params.custom
        }
        try {
            this.ResponseData = await Axios.get(params.url, {
                params: params.data,
                headers: Object.assign({}, params.header)
            });
            return this.ResponseData.data;
        } catch (e) {
            throw new Error(`GET 请求出错：${e.message}`)
        }
    }

    /**
     * POST请求
     * @param params
     * @constructor
     */
    public async POST(params: RequestParams): Promise<any> {
        try {
            this.ResponseData = await Axios.post(params.url, params.data, {
                headers: Object.assign({}, params.header)
            })
            return this.ResponseData.data;
        } catch (e) {
            throw new Error(`POST 请求出错：${e.message}`)
        }
    }

    /**
     * PUT 请求
     * @param params
     * @constructor
     */
    public async PUT(params: RequestParams): Promise<any> {
        try {
            this.ResponseData = await Axios.put(params.url, params.data, {
                headers: Object.assign({}, params.header)
            })
            return this.ResponseData.data;
        } catch (e) {
            throw new Error(`PUT 请求出错：${e.message}`)
        }
    }

    /**
     * DELETE 请求
     * @param params
     */
    public async DELETE(params: RequestParams): Promise<any> {
        try {
            this.ResponseData = await Axios.delete(params.url, {
                params: params.data,
                headers: Object.assign({}, params.header)
            })
            return this.ResponseData.data;
        } catch (e) {
            throw new Error(`DELETE 请求出错：${e.message}`)
        }
    }
}
