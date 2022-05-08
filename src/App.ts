// require('module-alias/register');
require('./moduleAlias');
import { app } from "electron";
import { Run } from "@run/Init.run";

app.on('ready', () => {
    new Run()
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
