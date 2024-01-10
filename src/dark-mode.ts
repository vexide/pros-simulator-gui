import { invoke } from "@tauri-apps/api/tauri";
import { get, writable } from "svelte/store";

const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");

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

function updateDocumentMode() {
    const setting = get(darkMode);
    const defaultDarkMode = prefersDarkMode.matches;
    if (setting === "auto") {
        document.documentElement.classList.toggle("dark", defaultDarkMode);
    } else {
        document.documentElement.classList.toggle("dark", setting === "dark");
    }
}

darkMode.subscribe(updateDocumentMode);
prefersDarkMode.addEventListener("change", updateDocumentMode);
