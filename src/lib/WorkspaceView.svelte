<script lang="ts">
    import { getContext, onMount } from "svelte";
    import type { Writable } from "svelte/store";
    import Card from "./Card.svelte";
    import Button from "./Button.svelte";
    import { Workspace } from "../workspace.ts";
    import type { Child } from "@tauri-apps/api/shell";
    import { workspace } from "../workspace.ts";
    import { spawnServer } from "../sidecar.ts";
    import { join } from "@tauri-apps/api/path";
    import Console from "./Console.svelte";
    import { Splitpanes, Pane } from "svelte-splitpanes";
    import type { Terminal } from "xterm";
    import colors from "ansi-colors";

    colors.enabled = true;

    let shutdownServer = new AbortController();
    let serverPromise: Promise<void> | undefined;
    let server: Child | undefined;
    let terminal: Terminal;

    onMount(() => {
        return () => {
            shutdownServer.abort();
        };
    });
</script>

<Splitpanes class="flex-1 p-4" horizontal={true} theme="">
    <Pane minSize={20}>
        <div class="flex w-full flex-[2] gap-4 [&>*]:flex-1">
            <Card title="Simulator">
                <div class="grid grid-cols-2 grid-rows-2 gap-4 self-stretch">
                    <Button
                        large
                        onClick={() => {
                            Workspace.close();
                        }}
                    >
                        Close workspace
                    </Button>
                    <Button
                        large
                        onClick={() => {
                            if (!server) {
                                serverPromise = (async () => {
                                    terminal.writeln("Starting server...");
                                    if ($workspace) {
                                        const wasmPath = await join(
                                            $workspace.path,
                                            "target",
                                            "wasm32-unknown-unknown",
                                            "debug",
                                            `${$workspace.name}.wasm`,
                                        );
                                        terminal.writeln(
                                            colors.gray(`> ${wasmPath}`),
                                        );
                                        try {
                                            server = await spawnServer(
                                                wasmPath,
                                                {
                                                    abort: shutdownServer.signal,
                                                    onExit(code) {
                                                        terminal.writeln(
                                                            `Process exited with code ${code}.`,
                                                        );
                                                        server = undefined;
                                                    },
                                                    onStderr(data) {
                                                        terminal.write(data);
                                                    },
                                                    onError(error) {
                                                        terminal.writeln(
                                                            `Error: ${error.message}`,
                                                        );
                                                        server = undefined;
                                                    },
                                                    onData(data) {
                                                        terminal.writeln(
                                                            colors.green(
                                                                JSON.stringify(
                                                                    data,
                                                                ),
                                                            ),
                                                        );
                                                    },
                                                },
                                            );
                                        } catch (err) {
                                            terminal.writeln(
                                                `Failed to start server: ${String(
                                                    err,
                                                )}`,
                                            );
                                        }
                                    }
                                })();
                            }
                        }}>Start simulator</Button
                    >
                </div>
            </Card>
            <Card title="LCD Display">...</Card>
        </div>
    </Pane>
    <Pane minSize={25}>
        <Card title="Console" class="flex-1">
            <Console bind:terminal />
        </Card>
    </Pane>
</Splitpanes>
