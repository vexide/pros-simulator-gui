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

    const start = () => Workspace.mutate((ws) => ws.startServer());
    const stop = () => Workspace.mutate((ws) => ws.stopServer());
    const build = () => Workspace.mutate((ws) => ws.build());

    onMount(() => stop);
</script>

<div class="flex flex-1 flex-col">
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
        <Button
            large
            on:click={stop}
            disabled={$workspace?.server === undefined}
        >
            Stop robot code
        </Button>
        <Button large on:click={build}>Build (Cargo)</Button>
    </div>
    <Splitpanes class="flex-1 p-4" horizontal={true} theme="">
        <Pane minSize={20}>
            <Card title="LCD Display" class="w-full">
                <LcdDisplay
                    lines={$workspace?.state.lcdLines}
                    elapsedSeconds={$workspace?.state.elapsedSeconds}
                />
            </Card>
        </Pane>
        <Pane minSize={25}>
            <Card title="Console" class="flex-1 gap-2">
                <svelte:fragment slot="actions">
                    <Button on:click={() => $workspace?.terminal.clear()}>
                        Clear
                    </Button>
                </svelte:fragment>
                <Console />
            </Card>
        </Pane>
    </Splitpanes>
</div>
