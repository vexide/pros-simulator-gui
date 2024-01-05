import { getCurrent } from "@tauri-apps/api/window";
import { writable } from "svelte/store";

const window = getCurrent();

export const title = writable("");

window.title().then((t) => {
    title.set(t);

    title.subscribe((t) => {
        window.setTitle(t);
    });
});
