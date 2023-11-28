import { readonly, writable, type Writable } from "svelte/store";
import { database, type RecentWorkspace } from "./database.ts";
import { invoke } from "@tauri-apps/api";

const workspaceStore: Writable<Workspace | null> = writable(null);
export const workspace = readonly(workspaceStore);

export class Workspace {
    static open(path: string) {
        const components = path.split("/");
        let name = components.pop();
        if (name === "") {
            name = components.pop();
        }
        const workspace = new Workspace(path, name ?? "Untitled Workspace");
        workspaceStore.set(workspace);
    }

    static openRecent(recent: RecentWorkspace) {
        const workspace = new Workspace(recent.path, recent.name);
        workspaceStore.set(workspace);
    }

    static close() {
        workspaceStore.set(null);
    }

    private constructor(
        public path: string,
        public name: string,
    ) {}

    static #homeDir = invoke<string | null>("get_home_dir");

    static async displayPath(path: string) {
        const home = await Workspace.#homeDir;
        if (!home) {
            return path;
        }
        if (path.startsWith(home)) {
            return "~" + path.slice(home.length);
        }
        return path;
    }
}

workspace.subscribe((ws) => {
    if (ws) {
        console.log("Updating recent workspaces");
        database.then(async (db) => {
            await db.execute(
                `INSERT INTO recent_workspaces (name, path, last_opened) VALUES ($1, $2, unixepoch())
                ON CONFLICT(path) DO UPDATE SET last_opened = unixepoch();`,
                [ws.name, ws.path],
            );
        });
    }
});
