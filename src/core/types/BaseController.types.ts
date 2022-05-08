export interface BaseControllerTypes {
    // render():  { [ key:string ]: any };
    ipc(): void;
    ui(): void;
    event(): void;
    monitor(): void;
}
