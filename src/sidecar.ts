import { appLocalDataDir, join } from "@tauri-apps/api/path";
import {
    writeBinaryFile,
    BaseDirectory,
    exists,
    readBinaryFile,
} from "@tauri-apps/api/fs";
import { Child, Command } from "@tauri-apps/api/shell";
import { invoke } from "@tauri-apps/api";
import ExtractWorker from "./sidecar/extract-worker.ts?worker";
import type { WorkerEvent as ExtractWorkerEvent } from "./sidecar/extract-worker.ts";
import { download } from "tauri-plugin-upload-api";
import { Collection } from "@discordjs/collection";

const env = invoke<string>("get_target").then((targetTriple) => {
    let binaryName = "pros-simulator-server";
    if (targetTriple.includes("windows")) {
        binaryName += ".exe";
    }
    return { targetTriple, binaryName };
});

export interface SpawnServerOptions {
    abort?: AbortSignal;
    onData?: (data: any) => void;
    onExit?: (code: number) => void;
    onError?: (error: Error) => void;
    onStderr?: (line: string) => void;
}

export async function spawnServer(
    wasmPath: string,
    opts?: SpawnServerOptions,
): Promise<Child> {
    const command = new Command((await env).binaryName, ["--stdio", wasmPath]);
    command.stdout.on("data", (line) => {
        const json = JSON.parse(line);
        opts?.onData?.(json);
    });
    command.stderr.on("data", (line) => {
        opts?.onStderr?.(line);
    });
    command.on("close", (data) => {
        opts?.onExit?.(data.code);
    });
    command.on("error", (error) => {
        opts?.onError?.(error);
    });
    const child = await command.spawn();
    opts?.abort?.addEventListener("abort", () => {
        child.kill();
    });
    return child;
}

export async function downloadServer(
    reportProgress?: (percent: number | undefined) => void,
) {
    const worker = new ExtractWorker();
    const appDataPath = await appLocalDataDir();
    const downloadPath = await join(appDataPath, "server.tar.gz");

    const url = `https://github.com/pros-rs/pros-simulator/releases/latest/download/pros-simulator-server-${
        (await env).targetTriple
    }.tar.gz`;
    reportProgress?.(0);
    await download(
        url,
        downloadPath,
        (progress, total) => reportProgress?.(progress / total),
        new Map([
            ["User-Agent", "pros-simulator-gui/1.0"],
            ["Accept", "application/gzip"],
        ]),
    );
    reportProgress?.(undefined);

    const tgzData = await readBinaryFile(downloadPath, {
        dir: BaseDirectory.AppLocalData,
    });
    const file = await new Promise<Uint8Array>((resolve, reject) => {
        worker.addEventListener(
            "message",
            (message: MessageEvent<ExtractWorkerEvent>) => {
                switch (message.data.type) {
                    case "done":
                        resolve(message.data.file);
                        break;
                    case "error":
                        reject(new Error(message.data.message));
                        break;
                }
            },
        );
        worker.addEventListener("error", (event) => {
            reject(event.error);
        });
        worker.postMessage(tgzData, { transfer: [tgzData.buffer] });
    });

    await writeBinaryFile((await env).binaryName, file, {
        dir: BaseDirectory.AppLocalData,
    });
    if (!(await env).targetTriple.includes("windows")) {
        const chmod = new Command("chmod", [
            "+x",
            await join(appDataPath, (await env).binaryName),
        ]);
        const child = await chmod.execute();
        if (child.code !== 0) {
            throw new Error(
                `Failed to make ${(await env).binaryName} executable: ${
                    child.stderr
                }`,
            );
        }
    }
}

export async function appInstallStatus() {
    const status = new Collection<string, boolean>();
    status.set("App", true);
    const serverPath = await join(
        await appLocalDataDir(),
        (await env).binaryName,
    );
    const serverExists = await exists(serverPath, {
        dir: BaseDirectory.AppLocalData,
    });
    status.set("Runtime", serverExists);
    if (serverExists) {
        try {
            let res = await fetch(
                "https://api.github.com/repos/pros-rs/pros-simulator/releases/latest",
            );
            if (!res.ok) throw new Error("Failed to check for updates");
            let json = await res.json();
            let latestVersion = json.tag_name;
            const command = new Command((await env).binaryName, ["--version"]);
            let output = await command.execute();
            let currentVersion = output.stdout.trim().split(" ")[1];
            if ("v" + currentVersion !== latestVersion)
                status.set("Runtime", false);
        } catch (error) {
            console.error("Failed to check for updates:", error);
        }
    }
    console.log(status);
    return status;
}

export type StringEvent =
    | "RobotCodeLoading"
    | "RobotCodeStarting"
    | "RobotCodeFinished"
    | "LcdInitialized"
    | "LcdShutdown";
export type ObjectEvent =
    | ["Warning", string]
    | ["ConsoleMessage", string]
    | ["RobotCodeError", { message: string; backtrace: string }]
    | ["LcdUpdated", string[]]
    | ["LcdColorsUpdated", number, number];
export type Message =
    | [
          "ControllerUpdate",
          [ControllerStateMessage | null, ControllerStateMessage | null],
      ]
    | ["LcdButtonsUpdate", [boolean, boolean, boolean]];

export interface ControllerStateMessage {
    digital: DigitalControllerState;
    analog: AnalogControllerState;
}

export interface DigitalControllerState {
    l1: boolean;
    l2: boolean;
    r1: boolean;
    r2: boolean;
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    x: boolean;
    b: boolean;
    y: boolean;
    a: boolean;
}

export interface AnalogControllerState {
    left_x: number;
    left_y: number;
    right_x: number;
    right_y: number;
}
