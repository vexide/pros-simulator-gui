import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { writeBinaryFile, BaseDirectory, exists } from "@tauri-apps/api/fs";
import { Child, Command } from "@tauri-apps/api/shell";
import { invoke } from "@tauri-apps/api";
import ExtractWorker from "./sidecar/extract-worker.ts?worker";
import type { WorkerEvent as ExtractWorkerEvent } from "./sidecar/extract-worker.ts";
import { ResponseType, fetch } from "@tauri-apps/api/http";
import { Collection } from "@discordjs/collection";

const targetTriple = await invoke<string>("get_target");
let binaryName = "pros-simulator-server";
if (targetTriple.includes("windows")) {
    binaryName += ".exe";
}

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
    const path = await join(await appLocalDataDir(), binaryName);
    const command = new Command(path, ["--stdio", wasmPath]);
    command.stdout.on("data", (line) => {
        const json = JSON.parse(line);
        opts?.onData?.(json);
    });
    command.stderr.on("data", (line) => {
        opts?.onStderr?.(line);
    });
    command.on("close", (code) => {
        opts?.onExit?.(code);
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

export async function downloadServer(progress?: (status: string) => void) {
    const worker = new ExtractWorker();

    const url = `https://github.com/pros-rs/pros-simulator/releases/latest/download/pros-simulator-server-${targetTriple}.tar.gz`;
    progress?.("Downloading");
    const response = await fetch<number[]>(url, {
        method: "GET",
        responseType: ResponseType.Binary,
    });
    if (!response.ok) {
        console.log("Failed to download url:", url);
        throw new Error(`Error code ${response.status}`);
    }
    progress?.("Extracting");

    const tgzData = new Uint8Array(response.data);
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

    console.log("Recieved");
    progress?.("Finishing up");

    await writeBinaryFile(binaryName, file, {
        dir: BaseDirectory.AppLocalData,
    });
}

export async function appInstallStatus() {
    const status = new Collection<string, boolean>();
    status.set("App", true);
    const serverPath = await join(await appLocalDataDir(), binaryName);
    const serverExists = await exists(serverPath, {
        dir: BaseDirectory.AppLocalData,
    });
    status.set("Runtime", serverExists);
    console.log(status);
    return status;
}
