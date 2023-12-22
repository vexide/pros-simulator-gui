import { readonly, writable, type Writable } from "svelte/store";
import { database, type RecentWorkspace } from "./database.ts";
import { invoke } from "@tauri-apps/api";
import { join, sep } from "@tauri-apps/api/path";
import { Terminal } from "@xterm/xterm";
import type { Child } from "@tauri-apps/api/shell";
import colors from "ansi-colors";
import {
    spawnServer,
    type ObjectEvent,
    type StringEvent,
    type Message,
} from "./sidecar.ts";
import { buildProject } from "./build.ts";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { LinkProvider } from "xterm-link-provider";
import {
    TerminalLinkDetectorAdapter,
    TerminalLocalLinkDetector,
} from "./pathDetector.ts";
import { open } from "@tauri-apps/api/shell";
import { openInVSCode } from "./openFile.ts";
import { title } from "./window.ts";

colors.enabled = true;

export const workspace: Writable<Workspace | null> = writable(null);

export enum Msg {
    Info,
    Error,
    Progress,
    Echo,
    Warn,
}

export class SimTerminal extends Terminal {
    log(message: string, msg = Msg.Info) {
        let text: string;
        switch (msg) {
            case Msg.Info: {
                text = colors.bold(message);
                break;
            }
            case Msg.Error: {
                text = colors.red(message);
                break;
            }
            case Msg.Progress: {
                text = colors.blue(`=> ${message}`);
                break;
            }
            case Msg.Echo: {
                text = colors.gray(`$ ${message}`);
                break;
            }
            case Msg.Warn: {
                text = colors.yellow(message);
                break;
            }
        }
        this.writeln(text);
    }
}

export class Workspace {
    static open(path: string) {
        const components = path.split(sep);
        let name = components.pop();
        if (name === "") {
            name = components.pop();
        }
        const ws = new Workspace(path, name ?? "Untitled Workspace");
        workspace.set(ws);
    }

    static openRecent(recent: RecentWorkspace) {
        const ws = new Workspace(recent.path, recent.name);
        workspace.set(ws);
    }

    static close() {
        workspace.set(null);
    }

    static mutate(fn: (ws: Workspace) => void) {
        workspace.update((ws) => {
            if (ws) {
                fn(ws);
            }
            return ws;
        });
    }

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

    state = new State();
    terminal = new SimTerminal({
        convertEol: true,
        fontFamily: "ui-monospace, monospace",
        allowTransparency: true,
        theme: {
            background: "#00000000",
        },
    });
    #serverProcess: AbortController | undefined;
    #buildProcess: AbortController | undefined;
    #timer: number | undefined;
    server: Child | undefined;
    fitAddon = new FitAddon();
    webglAddon = new WebglAddon();

    private constructor(
        public path: string,
        public name: string,
    ) {
        this.terminal.loadAddon(this.fitAddon);
        this.terminal.loadAddon(this.webglAddon);

        this.webglAddon.onContextLoss(() => {
            this.webglAddon.dispose();
        });

        this.terminal.registerLinkProvider(
            new TerminalLinkDetectorAdapter(
                new TerminalLocalLinkDetector(this.terminal),
                async (e, link) => {
                    console.log(link);
                    const success = await openInVSCode(link.text);
                    if (success) {
                        return;
                    }

                    if (link.uri) {
                        console.log(link.uri.href);
                        await open(link.uri.href);
                        return;
                    }

                    if (link.parsedLink) {
                        const url = new URL(`file://${link.parsedLink.path}`);
                        await open(url.href);
                        return;
                    }

                    const url = new URL(`file://${link.text}`);
                    await open(url.href);
                },
            ),
        );
    }

    tick() {
        this.state.elapsedSeconds += 1;
    }

    startServer() {
        if (this.#serverProcess) {
            return;
        }

        const { terminal } = this;

        const serverProcess = new AbortController();
        this.#serverProcess = serverProcess;
        clearInterval(this.#timer);
        this.state = new State();
        terminal.log("Starting server", Msg.Progress);
        (async () => {
            const wasmPath = await join(
                this.path,
                "target",
                "wasm32-unknown-unknown",
                "debug",
                `${this.name}.wasm`,
            );
            terminal.log(wasmPath, Msg.Echo);

            try {
                const server = await spawnServer(wasmPath, {
                    abort: serverProcess.signal,
                    onExit(code) {
                        terminal.log(
                            `Process exited with code ${code}.`,
                            code === 0 ? Msg.Info : Msg.Error,
                        );
                        Workspace.mutate((ws) => ws.afterFinish());
                    },
                    onStderr(data) {
                        terminal.write(data);
                    },
                    onError(error) {
                        terminal.log(`Error: ${error.message}`, Msg.Error);
                        Workspace.mutate((ws) => ws.afterFinish());
                    },
                    onData(data) {
                        Workspace.mutate((ws) => ws.handleEvent(data));
                        // terminal.writeln(colors.green(JSON.stringify(data)));
                    },
                });

                Workspace.mutate((ws) => (ws.server = server));
            } catch (err) {
                terminal.writeln(`Failed to start server: ${String(err)}`);
            }
        })();
    }

    stopServer() {
        if (this.#serverProcess) {
            this.#serverProcess.abort();
        }
        this.afterFinish();
    }

    afterFinish() {
        this.server = undefined;
        this.#serverProcess = undefined;
        clearInterval(this.#timer);
    }

    async sendInput(event: Message) {
        if (this.server) {
            const text =
                JSON.stringify({
                    [event[0]]: event[1],
                }) + "\n";
            this.terminal.write(text);
            await this.server.write(text);
        }
    }

    handleEvent(event: unknown) {
        if (typeof event === "string") {
            this.#handleStringEvent(event as StringEvent);
        } else if (typeof event === "object" && event) {
            const variant = Object.keys(event)[0] as any;
            const payload = Reflect.get(event, variant);
            this.#handleObjectEvent([variant, payload]);
        }
    }

    #handleStringEvent(name: StringEvent) {
        switch (name) {
            case "RobotCodeStarting": {
                this.terminal.log("Robot code running", Msg.Progress);
                this.#timer = setInterval(() => this.tick(), 1000);
                break;
            }
            case "LcdInitialized": {
                this.state.lcdLines = [];
                break;
            }
            case "LcdShutdown": {
                this.state.lcdLines = undefined;
                break;
            }
            case "RobotCodeFinished": {
                clearInterval(this.#timer);
                this.terminal.log("Robot code completed", Msg.Progress);
                break;
            }
        }
    }

    #handleObjectEvent([variant, payload]: ObjectEvent) {
        switch (variant) {
            case "LcdUpdated": {
                this.state.lcdLines = payload;
                break;
            }
            case "ConsoleMessage": {
                this.terminal.writeln(payload);
                break;
            }

            case "Warning": {
                this.terminal.log(payload, Msg.Error);
                break;
            }
        }
    }

    async build() {
        this.#buildProcess?.abort();
        this.#buildProcess = new AbortController();
        const { terminal } = this;
        try {
            await buildProject(this.path, {
                abort: this.#buildProcess.signal,
                onStderr(data) {
                    terminal.write(data);
                },
                onExit(code) {
                    terminal.writeln(`Process exited with code ${code}.`);
                },
                onError(error) {
                    terminal.writeln(`Error: ${error.message}`);
                },
            });
        } catch (err) {
            terminal.writeln(`Failed to build: ${String(err)}`);
        }
    }
}

export class State {
    lcdLines: string[] | undefined;
    elapsedSeconds = 0;
}

let oldWs: Workspace | null = null;
workspace.subscribe((ws) => {
    if (ws) {
        title.set(ws.name);
    } else {
        title.set("PROS Simulator");
    }

    if (ws && ws !== oldWs) {
        console.log("Updating recent workspaces");
        database.then(async (db) => {
            await db.execute(
                `INSERT INTO recent_workspaces (name, path, last_opened) VALUES ($1, $2, unixepoch())
                ON CONFLICT(path) DO UPDATE SET last_opened = unixepoch();`,
                [ws.name, ws.path],
            );
        });
    }
    oldWs = ws;
});
