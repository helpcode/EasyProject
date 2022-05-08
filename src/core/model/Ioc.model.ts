class IocModel {
    private _classPool: Array<{ new (...args: any[]): {}; }> = [];

    get classPool(): Array<{ new(...args: any[]): {} }> {
        return this._classPool;
    }

    set classPool(value: Array<{ new(...args: any[]): {} }>) {
        this._classPool = [...value, ...this._classPool]
    }
}

export default new IocModel();
