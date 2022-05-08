import { app, BrowserWindow, TouchBar, dialog, shell } from "electron";
import Windows from "@/core/model/Windows.model";
import Config from "@config/Index.config";
const { TouchBarLabel, TouchBarButton,TouchBarSpacer } = TouchBar;

export class Touchbar {
    constructor() {
        Windows.CurrentBrowserWindow.setTouchBar(new TouchBar(Config.TouchBarConfig))
    }
}
