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
    const command = new Command(binaryName, ["--stdio", wasmPath]);
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

    const url = `https://github.com/pros-rs/pros-simulator/releases/latest/download/pros-simulator-server-${targetTriple}.tar.gz`;
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

    await writeBinaryFile(binaryName, file, {
        dir: BaseDirectory.AppLocalData,
    });
    if (!targetTriple.includes("windows")) {
        const chmod = new Command("chmod", [
            "+x",
            await join(appDataPath, binaryName),
        ]);
        const child = await chmod.execute();
        if (child.code !== 0) {
            throw new Error(
                `Failed to make ${binaryName} executable: ${child.stderr}`,
            );
        }
    }
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
