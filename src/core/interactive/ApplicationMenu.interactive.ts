import {app, Menu, shell, MenuItemConstructorOptions, MenuItem} from "electron";
import Config from "@config/Index.config";

export class ApplicationMenu {
    private AppMenu!: Menu;
    constructor() {
        this.buildFromTemplate();
    }

    buildFromTemplate(): void {
        this.AppMenu = Menu.buildFromTemplate(Config.TemplateMenu);
        Menu.setApplicationMenu(this.AppMenu);
    }
}


