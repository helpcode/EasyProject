import moment from "moment"
import { appendFileSync } from "fs"
import { join } from "path";
import Config from "@config/Index.config";
import { Injectable } from "@annotation/Ioc.annotation";
import os from "os"

@Injectable()
export class LogsUtils {

    /**
     * 返回日志文件名 application_2020-07-16_21-03-21.log
     * @param level 日志类型
     * @constructor
     */
    public GetTime(level: string = "application"): string {
        return `${level}_${moment().format("YYYY-MM-DD-HH")}.log`;
    }

    /**
     * 传入数据生成日志
     * @param data 数据
     * @param level 日志类型
     */
    public logs(data: string, level: string = "application"): void {
        appendFileSync(join(
            __dirname,
            `${Config.LogsPath}/${this.GetTime(level)}`), `【${moment().format("YYYY/MM/DD HH:mm:ss")}】${data}${os.EOL}${os.EOL}`)
    }
}

