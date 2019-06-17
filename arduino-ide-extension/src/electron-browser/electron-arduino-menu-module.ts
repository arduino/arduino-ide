import { ContainerModule } from "inversify";
import { ElectronArduinoMainMenuFactory } from "./electron-arduino-main-menu-factory";
import { ElectronMainMenuFactory } from "@theia/core/lib/electron-browser/menu/electron-main-menu-factory";
import { ElectronMenuContribution } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution"
import { ElectronArduinoMenuContribution } from "./electron-arduino-menu-contribution";

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ElectronArduinoMainMenuFactory).toSelf().inSingletonScope();
    rebind(ElectronMainMenuFactory).to(ElectronArduinoMainMenuFactory);

    bind(ElectronArduinoMenuContribution).toSelf().inSingletonScope();
    rebind(ElectronMenuContribution).to(ElectronArduinoMenuContribution);
})