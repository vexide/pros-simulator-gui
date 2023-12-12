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
    import XmarkSolid from "svelte-awesome-icons/XmarkSolid.svelte";
    import { buildProject } from "../build.ts";

    colors.enabled = true;

    let shutdownServer = new AbortController();
    let cancelBuild = new AbortController();
    let serverPromise: Promise<void> | undefined;
    let server: Child | undefined;
    let terminal: Terminal;
    let lcdLines: string[] | undefined;
    let elapsedSeconds = 0;
    let timer: number | undefined;

    function start() {
        if (server) return;
        lcdLines = undefined;
        serverPromise = (async () => {
            terminal.writeln("Starting server...");
            elapsedSeconds = 0;
            clearInterval(timer);
            timer = setInterval(() => {
                terminal.writeln("tick");
                elapsedSeconds += 1;
            }, 1000);
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
                case "RobotCodeFinished": {
                    clearInterval(timer);
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

    function stop() {
        if (server) {
            shutdownServer.abort();
            shutdownServer = new AbortController();
        }
        clearInterval(timer);
    }

    onMount(() => {
        return () => {
            shutdownServer.abort();
        };
    });

    async function build() {
        if ($workspace) {
            cancelBuild.abort();
            cancelBuild = new AbortController();
            try {
                await buildProject($workspace.path, {
                    abort: cancelBuild.signal,
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
</script>

<div class="flex gap-4 self-stretch p-4 pb-0">
    <Button
        class="flex items-center justify-center self-stretch p-2.5"
        plain
        large
        title="Close workspace"
        on:click={() => {
            Workspace.close();
        }}
    >
        <XmarkSolid size="14" />
    </Button>
    <Button large on:click={start}>Start robot code</Button>
    <Button large on:click={stop} disabled={server === undefined}>
        Stop robot code
    </Button>
    <Button large on:click={build}>Build (Cargo)</Button>
</div>
<Splitpanes class="flex-1 p-4" horizontal={true} theme="">
    <Pane minSize={20}>
        <Card title="LCD Display" class="w-full">
            <LcdDisplay lines={lcdLines} {elapsedSeconds} />
        </Card>
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
