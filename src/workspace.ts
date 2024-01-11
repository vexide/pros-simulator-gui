import { get, readonly, writable, type Writable } from "svelte/store";
import { database, type RecentWorkspace } from "./database.ts";
import { invoke } from "@tauri-apps/api";
import { join, sep } from "@tauri-apps/api/path";
import { readDir } from "@tauri-apps/api/fs";
import { Terminal } from "@xterm/xterm";
import type { Child } from "@tauri-apps/api/shell";
import colors from "ansi-colors";
import {
    spawnServer,
    type ObjectEvent,
    type StringEvent,
    type ObjectMessage,
    type StringMessage,
} from "./sidecar.ts";
import { buildProject } from "./build.ts";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { CanvasAddon } from "@xterm/addon-canvas";
import { LinkProvider } from "xterm-link-provider";
import {
    TerminalLinkDetectorAdapter,
    TerminalLocalLinkDetector,
} from "./pathDetector.ts";
import { open } from "@tauri-apps/api/shell";
import { openInVSCode } from "./openFile.ts";
import { title } from "./window.ts";
import cliArgs from "./cli.ts";
import settings from "./settings.ts";

colors.enabled = true;

export const workspace: Writable<Workspace | null> = writable(null);

cliArgs().then((args) => {
    if (args.workspace) {
        Workspace.open(args.workspace);
    }
});

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
        console.log("Opening:", path);
        const components = path.split(sep);
        let name = components.pop();
        if (name === "") {
            name = components.pop();
        }
        const ws = new Workspace(path, name ?? "Untitled Workspace");
        workspace.set(ws);
    }

    static openRecent(recent: RecentWorkspace) {
        console.log("Using recent workspace:", recent);
        const ws = new Workspace(recent.path, recent.name);
        workspace.set(ws);
    }

    static close() {
        console.log("Closing workspace");
        workspace.set(null);
    }

    static mutate(fn: (ws: Workspace) => void) {
        console.log("Mutating workspace");
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

    private constructor(
        public path: string,
        public name: string,
    ) {
        console.log("Initializing workspace");
        this.terminal.loadAddon(this.fitAddon);
        switch (get(settings.consoleRenderer)) {
            case "webgl": {
                console.log("Using webgl renderer");
                const addon = new WebglAddon();
                this.terminal.loadAddon(addon);

                addon.onContextLoss(() => {
                    addon.dispose();
                });
                break;
            }
            case "canvas": {
                console.log("Using canvas renderer");
                this.terminal.loadAddon(new CanvasAddon());
                break;
            }
            case "none": {
                console.log("Using compat renderer");
                break;
            }
        }

        console.log("Using link provider");
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
        console.log("Ready to render workspace");
    }

    tick() {
        this.state.elapsedSeconds += 1;
    }

    startServer() {
        console.log("Starting server!", this);
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
            const args = await cliArgs();
            let wasmPath = args.code;
            if (!wasmPath) {
                wasmPath = await join(
                    this.path,
                    "target",
                    "wasm32-unknown-unknown",
                    "debug",
                    `${this.name}.wasm`,
                );
            }
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
        console.log("Stopping server!", this);
        if (this.#serverProcess) {
            this.#serverProcess.abort();
        }
        this.afterFinish();
    }

    afterFinish() {
        console.log("Server finished", this);
        this.server = undefined;
        this.#serverProcess = undefined;
        clearInterval(this.#timer);
    }

    async sendMessage<T extends ObjectMessage | [message: StringMessage]>(
        ...args: T
    ) {
        const [event, payload] = args;
        if (this.server) {
            let text;
            if (payload === undefined) {
                text = JSON.stringify(event) + "\n";
            } else {
                text =
                    JSON.stringify({
                        [event]: payload,
                    }) + "\n";
            }
            await this.server.write(text);
        }
    }

    handleEvent(event: unknown) {
        console.log("Recieved event", this, event);
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
            case "RobotCodeRunning": {
                this.terminal.log("Robot code running", Msg.Progress);
                this.#timer = setInterval(
                    () => Workspace.mutate((ws) => ws.tick()),
                    1000,
                );
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
            case "AllTasksFinished": {
                clearInterval(this.#timer);
                this.terminal.log("Robot code completed", Msg.Progress);
                break;
            }
            case "ResourcesRequired": {
                this.sendMessage("PortsUpdate", {
                    1: "Motor",
                });
                this.sendMessage("BeginSimulation");
                this.sendMessage("PhaseChange", {
                    autonomous: false,
                    enabled: true,
                    is_competition: false,
                });
                break;
            }
            default: {
                this.terminal.log(`Unknown event: ${name}`, Msg.Info);
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

            default: {
                this.terminal.log(
                    `Unknown event: ${variant} ${JSON.stringify(payload)}`,
                    Msg.Info,
                );
            }
        }
    }

    async build() {
        console.log("Building project", this);
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
            console.log("Added recent workspace:", ws);
        });
    }
    oldWs = ws;
});
