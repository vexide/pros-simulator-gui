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
    import type { Terminal } from "@xterm/xterm";
    import colors from "ansi-colors";
    import LcdDisplay from "./LcdDisplay.svelte";

    colors.enabled = true;

    let shutdownServer = new AbortController();
    let serverPromise: Promise<void> | undefined;
    let server: Child | undefined;
    let terminal: Terminal;
    let lcdLines: string[] | undefined;

    function start() {
        if (server) return;
        lcdLines = undefined;
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
                terminal.writeln(colors.gray(`> ${wasmPath}`));
                try {
                    server = await spawnServer(wasmPath, {
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
                            terminal.writeln(`Error: ${error.message}`);
                            server = undefined;
                        },
                        onData(data) {
                            handleEvent(data);
                            terminal.writeln(
                                colors.green(JSON.stringify(data)),
                            );
                        },
                    });
                } catch (err) {
                    terminal.writeln(`Failed to start server: ${String(err)}`);
                }
            }
        })();
    }

    function handleEvent(data: unknown) {
        if (typeof data === "string") {
            switch (data) {
                case "LcdInitialized": {
                    lcdLines = [];
                    break;
                }
                case "LcdShutdown": {
                    lcdLines = undefined;
                    break;
                }
            }
        } else if (typeof data === "object" && data) {
            const variant = Object.keys(data)[0];
            const payload = Reflect.get(data, variant);
            switch (variant) {
                case "LcdUpdated": {
                    const lines: string[] = payload;
                    lcdLines = lines;
                }
            }
        }
    }

    onMount(() => {
        return () => {
            shutdownServer.abort();
        };
    });
</script>

<Splitpanes class="flex-1 p-4" horizontal={true} theme="">
    <Pane minSize={20}>
        <div class="flex w-full flex-[2] gap-4">
            <Card title="Simulator" class="flex-1 flex-shrink-0">
                <div class="grid grid-cols-2 grid-rows-2 gap-4 self-stretch">
                    <Button
                        large
                        on:click={() => {
                            Workspace.close();
                        }}
                    >
                        Close workspace
                    </Button>
                    <Button large on:click={start}>Start simulator</Button>
                </div>
            </Card>
            <Card title="LCD Display" class="">
                <LcdDisplay lines={lcdLines} />
            </Card>
        </div>
    </Pane>
    <Pane minSize={25}>
        <Card title="Console" class="flex-1 gap-2">
            <svelte:fragment slot="actions">
                <Button
                    on:click={() => {
                        terminal.clear();
                    }}
                >
                    Clear
                </Button>
            </svelte:fragment>
            <Console bind:terminal />
        </Card>
    </Pane>
</Splitpanes>
