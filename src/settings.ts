import { writable, type Writable } from "svelte/store";

export type ConsoleRenderer = "webgl" | "canvas" | "none";

export interface ISettings {
    consoleRenderer: ConsoleRenderer;
}

export type Settings = {
    [K in keyof ISettings]: Writable<ISettings[K]>;
};

function initSettings(): Settings {
    const defaultSettings: Readonly<ISettings> = {
        consoleRenderer: "webgl",
    };
    const settings: Record<string, Writable<any>> = {};

    for (const key of Object.keys(defaultSettings)) {
        const store = writable(
            localStorage.getItem(`setting-${key}`) ??
                defaultSettings[key as keyof Settings],
        );
        store.subscribe((newValue) => {
            localStorage.setItem(`setting-${key}`, newValue);
        });
        settings[key] = store;
    }

    return settings as Settings;
}

const settings = initSettings();
export default settings;
