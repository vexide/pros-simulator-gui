import { invoke } from "@tauri-apps/api/tauri";
import { writable } from "svelte/store";

export type Theme = "auto" | "light" | "dark";
export const darkMode = writable<Theme>("auto");

invoke<Theme>("plugin:theme|get_theme").then((theme) => {
    darkMode.set(theme);

    let oldTheme = theme;
    darkMode.subscribe((newValue) => {
        if (newValue === oldTheme) return;
        oldTheme = newValue;

        invoke("plugin:theme|set_theme", {
            theme: newValue,
        });
    });
});
