import { readonly, writable, type Writable } from "svelte/store";

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

    static close() {
        workspaceStore.set(null);
    }

    private constructor(
        public path: string,
        public name: string,
    ) {}
}
