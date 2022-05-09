import Lowdb from "lowdb";
import FileSync from "lowdb/adapters/FileSync"
import { homedir } from "os";
import { resolve } from "path";
import { ensureDirSync } from "fs-extra";

class Db {

    public db!: Lowdb.lowdb & {
        defaults: (arg: { [key:string]: any }) => any;
        get: (arg: string) => any;
        unset: (asg: string) => any;
        read: () => any;
    };

    public ConfirPath: string = `${homedir()}/.project`;

    constructor () {
        this.initDBSystem();
    }

    public initDBSystem() {
        ensureDirSync(this.ConfirPath)
        // @ts-ignore
        this.db = new Lowdb(new FileSync(resolve(this.ConfirPath, 'db.json')));
        this.db.defaults({
            projects: [],
            setting: {
                isOpen: false,
                selectThemeIndex: 0,
                mask: {
                    open: true,
                    opacity: 0.4,
                    blur: 0
                },
                list: [
                    { system: false, type: 'color', text: '亮色', BgColor: 'rgb(227 224 224 / 80%)', textColor: '#222', activeBgColor: '#c5c2c2' },
                    { system: false, type: 'color', text: '暗色', BgColor: 'rgb(35 37 47 / 80%)', textColor: '#c3d1e9', activeBgColor: '#434b5c' },
                    { system: false, type: 'color', text: '护眼', BgColor: 'rgb(199 235 202 / 80%)', textColor: '#405840', activeBgColor: '#d4f0d6' },
                    { system: false, type: 'color', text: '深邃', BgColor: 'rgb(22 32 47 / 80%)', textColor: '#a0b4c8', activeBgColor: '#1c283b' },
                    { system: false, type: 'color', text: '盎然', BgColor: 'rgb(121 149 147 / 80%)', textColor: '#d6e1df', activeBgColor: 'rgb(104 165 160 / 95%)' },
                    { system: false, type: 'color', text: '肃穆蓝', BgColor: 'rgb(100 130 192 / 80%)', textColor: '#d6e1df', activeBgColor: 'rgb(106 144 215 / 95%)' },
                    { system: false, type: 'color', text: '少女粉', BgColor: 'rgb(175 82 119 / 80%)', textColor: '#d6e1df', activeBgColor: 'rgb(197 93 134 / 95%)' },
                    { system: false, type: 'color', text: '基佬紫', BgColor: 'rgb(187 64 171 / 80%)', textColor: '#d6e1df', activeBgColor: 'rgb(209 72 191 / 95%)' },
                    { system: false, type: 'color', text: '活力橙', BgColor: 'rgb(203 165 61 / 80%)', textColor: '#d6e1df', activeBgColor: 'rgb(219 178 68 / 95%)' },
                    { system: false, type: 'img', text: '少女', BgColor: 'url("https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fi0.hdslb.com%2Fbfs%2Farticle%2Ffbd24661b2186b274a9214dafcbf54c99e4b67e2.jpg&refer=http%3A%2F%2Fi0.hdslb.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1653329712&t=c05effa20c49faa5c73198f63a51c0f0")', textColor: '#d6e1df', activeBgColor: 'rgb(26 28 42 / 77%)' },
                    { system: false, type: 'img', text: '地球', BgColor: 'url("https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fi0.hdslb.com%2Fbfs%2Farticle%2F903b941d059186ccacaff616e8258a3f02964216.jpg&refer=http%3A%2F%2Fi0.hdslb.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1653330780&t=21fdce669ec228a2670dc938a2f4c809")', textColor: '#d6e1df', activeBgColor: 'rgb(95 22 10 / 86%)' },
                    { system: false, type: 'img', text: '泛舟', BgColor: 'url("https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg1.doubanio.com%2Fview%2Frichtext%2Flarge%2Fpublic%2Fp231769778.jpg&refer=http%3A%2F%2Fimg1.doubanio.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1653330978&t=ee3158860a014253d882e78d84139cf7")', textColor: '#d6e1df', activeBgColor: 'rgb(106 103 58 / 88%)' },
                    { system: false, type: 'img', text: '汽车', BgColor: 'url("https://img2.baidu.com/it/u=2222928740,2967545615&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=1028")', textColor: '#d6e1df', activeBgColor: 'rgb(12 13 13 / 72%)' },
                    { system: false, type: 'img', text: '海绵宝宝', BgColor: 'url("https://c-ssl.duitang.com/uploads/blog/202110/10/20211010134724_b9435.thumb.1000_0.jpeg")', textColor: '#d6e1df', activeBgColor: 'rgb(239 81 79 / 65%)' },
                    { system: false, type: 'img', text: '七龙珠', BgColor: 'url("https://c-ssl.duitang.com/uploads/blog/202106/05/20210605202326_66fd6.thumb.1000_0.jpg")', textColor: '#d6e1df', activeBgColor: 'rgb(197 140 3 / 86%)' },
                    { system: false, type: 'img', text: '唯美', BgColor: 'url("https://c-ssl.duitang.com/uploads/blog/202110/31/20211031124432_ea58c.thumb.1000_0.jpeg")', textColor: '#d6e1df', activeBgColor: 'rgb(197 140 3 / 86%)' }
                ]
            }
        }).write()
    }

    /**
     * 根据项目名查找数据库的指定项目
     * @param name
     */
    public findName(name: string, table: string = "projects", key: string = "FolderName"): { [key: string]: any} {
        return this.db.get(table).find({ [ key ]: name }).value()
    }

    public isHaveName(name: string, table: string = "projects"): { [key: string]: any} {
        return this.db.get(table).find({ "name": name }).value()
    }

    /**
     * 获取所有项目
     */
    public project(table: string = "projects"): undefined | { [key: string]: any} {
        return this.db.get(table).value();
    }

    public remove(obj: { [key: string]: any}, table: string = "projects"): undefined | { [key: string]: any} {
        return this.db.get(table)
          .remove(obj)
          .write();
    }

    /**
     * 修改表中的数据
     * @param key 表下的对象名
     * @param value 数值
     * @param table 哪张表
     */
    public update(key: string, value: any, table: string = "setting"): void {
        this.db.read().set(`${table}.${key}`, value).write()
    }

    /**
     * 保存项目至数据库
     * @param obj
     */
    public saveProject(obj: { [key: string]: any}, table: string = "projects"): void {
        this.db.get(table)
            .push(obj)
            .write()
    }
}

export default new Db();