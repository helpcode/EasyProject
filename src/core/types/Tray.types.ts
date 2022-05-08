import { MenuItem, MenuItemConstructorOptions } from "electron";

export interface TrayConfig {
    TopMenuRightImage: string;
    TopMenuRightDropdown: Array<(MenuItemConstructorOptions) | (MenuItem)>;
    TopMenuRightTips: string;
}
