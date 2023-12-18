import { readable } from "svelte/store";
// import "tauri-plugin-gamepad-api";

const controllers = readable(navigator.getGamepads(), (set) => {
    const update = () => {
        set(navigator.getGamepads());
    };
    window.addEventListener("gamepadconnected", update);
    window.addEventListener("gamepaddisconnected", update);
    const updater = setInterval(update, 1000 / 60);
    return () => {
        window.removeEventListener("gamepadconnected", update);
        window.removeEventListener("gamepaddisconnected", update);
        clearInterval(updater);
    };
});

export default controllers;
