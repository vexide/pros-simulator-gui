import "./dark-mode.ts";
import "./styles.scss";
import App from "./App.svelte";
import { getMatches } from "@tauri-apps/api/cli";

const app = new App({
    target: document.body,
});

export default app;
