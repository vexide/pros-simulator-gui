import { Command, type Child } from "@tauri-apps/api/shell";
import { gray } from "ansi-colors";
import { sep } from "@tauri-apps/api/path";

export interface BuildOptions {
    abort?: AbortSignal;
    onExit?: (code: number) => void;
    onError?: (error: Error) => void;
    onStderr?: (line: string) => void;
}

export function buildProject(
    path: string,
    opts: BuildOptions = {},
): Promise<Child> {
    const args = [
        "+nightly",
        "build",
        "--color",
        "always",
        "--manifest-path",
        `${path}${sep}Cargo.toml`,
        "--message-format",
        "json-render-diagnostics",
        "--target",
        "wasm32-unknown-unknown",
        "-Zbuild-std=std,panic_abort",
    ];
    opts.onStderr?.(gray("> cargo " + args.join(" ") + "\n"));
    const command = new Command("cargo", args, {
        cwd: path,
    });

    command.stderr.on("data", (line) => {
        opts.onStderr?.(line);
    });
    command.on("close", (data) => {
        opts.onExit?.(data.code);
    });
    command.on("error", (error) => {
        opts.onError?.(error);
    });

    return new Promise<Child>((resolve, reject) => {
        command
            .spawn()
            .then((child) => {
                opts.abort?.addEventListener("abort", () => {
                    child.kill();
                });
                resolve(child);
            })
            .catch(reject);
    });
}
