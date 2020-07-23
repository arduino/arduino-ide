export const MainMenuManager = Symbol('MainMenuManager');
export interface MainMenuManager {
    /**
     * Call this method if you have changed the content of the main menu (updated a toggle flag, removed/added new groups or menu items)
     * and you want to re-render it from scratch. Works for electron too.
     */
    update(): void;
}
