class Utils {
    /**
     * 发送GET 请求
     * @param URL 地址
     * @param params 参数
     * @param callback 回调
     * @constructor
     */
    Http(URL, params,callback) {
        $.ajax({
            url: `http://www.bmycode.com:3000/api${URL}`,
            type: 'GET',
            data: params,
            success: (res)=> {
                callback(res)
            }
        })
    }

    /**
     * 根据时间戳返回多久之前的时间
     * @param timespan 时间戳
     * @returns {string}
     */
    formatTime (timespan) {
        var dateTime = new Date(timespan);
        var year = dateTime.getFullYear();
        var month = dateTime.getMonth() + 1;
        var day = dateTime.getDate();
        var hour = dateTime.getHours();
        var minute = dateTime.getMinutes();
        var second = dateTime.getSeconds();
        var now = new Date();
        var now_new = Date.parse(now.toDateString());  //typescript转换写法

        var milliseconds = 0;
        var timeSpanStr;

        milliseconds = now_new - timespan;

        if (milliseconds <= 1000 * 60 * 1) {
            timeSpanStr = '刚刚';
        }
        else if (1000 * 60 * 1 < milliseconds && milliseconds <= 1000 * 60 * 60) {
            timeSpanStr = Math.round((milliseconds / (1000 * 60))) + '分钟前';
        }
        else if (1000 * 60 * 60 * 1 < milliseconds && milliseconds <= 1000 * 60 * 60 * 24) {
            timeSpanStr = Math.round(milliseconds / (1000 * 60 * 60)) + '小时前';
        }
        else if (1000 * 60 * 60 * 24 < milliseconds && milliseconds <= 1000 * 60 * 60 * 24 * 15) {
            timeSpanStr = Math.round(milliseconds / (1000 * 60 * 60 * 24)) + '天前';
        }
        else if (milliseconds > 1000 * 60 * 60 * 24 * 15 && year == now.getFullYear()) {
            timeSpanStr = month + '月' + day + '号' + hour + ':' + minute;
        } else {
            timeSpanStr = year + '年' + month + '月' + day + '号' + hour + ':' + minute;
        }
        return timeSpanStr;
    };
}

window.$Utils = new Utils()
