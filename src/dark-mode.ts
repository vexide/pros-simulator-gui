import { invoke } from "@tauri-apps/api/tauri";
import { writable } from "svelte/store";
export const darkMode = writable("auto");

invoke<"auto" | "light" | "dark">("plugin:theme|get_theme").then((theme) => {
    darkMode.set(theme);
});

darkMode.subscribe((newValue) => {
    invoke("plugin:theme|set_theme", {
        theme: newValue,
    });
});
