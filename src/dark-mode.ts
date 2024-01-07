import { writable } from "svelte/store";

const systemMode = window.matchMedia("(prefers-color-scheme: dark)");

export const darkMode = writable(
    (localStorage.theme as "auto" | "dark" | "light") ?? "auto",
);

darkMode.subscribe((newValue) => {
    localStorage.theme = newValue;
    update();
});

function update() {
    if (
        localStorage.theme === "dark" ||
        (localStorage.theme === "auto" && systemMode.matches)
    ) {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
}

systemMode.addEventListener("change", update);
update();
