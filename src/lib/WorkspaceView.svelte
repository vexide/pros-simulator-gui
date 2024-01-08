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
    import CircleStopRegular from "svelte-awesome-icons/CircleStopRegular.svelte";
    import CirclePlayRegular from "svelte-awesome-icons/CirclePlayRegular.svelte";
    import HammerSolid from "svelte-awesome-icons/HammerSolid.svelte";
    import DeviceListView from "./DeviceListView.svelte";
    import type { Readable } from "svelte/motion";

    let controllerConnected: Readable<boolean>;

    const start = () => Workspace.mutate((ws) => ws.startServer());
    const stop = () => Workspace.mutate((ws) => ws.stopServer());
    const build = () => Workspace.mutate((ws) => ws.build());

    onMount(() => stop);
</script>

<div class="flex flex-1 flex-col overflow-clip">
    <div class="flex gap-4 self-stretch p-4 pb-0">
        <Button
            class="flex items-center justify-center self-stretch p-2.5"
            plain
            large
            title="Close workspace"
            on:click={() => {
                Workspace.close();
            }}
            icon={XmarkSolid}
        />
        <Button
            large
            on:click={start}
            disabled={$workspace?.server !== undefined}
            icon={CirclePlayRegular}
            iconColor="#34D399"
        >
            Start robot code</Button
        >
        <Button
            large
            on:click={stop}
            disabled={$workspace?.server === undefined}
            icon={CircleStopRegular}
            iconColor="#F87171"
        >
            Stop robot code
        </Button>
        <Button large on:click={build} icon={HammerSolid}>Build (Cargo)</Button>
    </div>
    <Splitpanes
        class="flex-1 overflow-clip p-4"
        horizontal={true}
        theme=""
        on:resized={() => {
            $workspace?.fitAddon.fit();
        }}
    >
        <Pane minSize={20} class="flex gap-4">
            <DeviceListView bind:controllerConnected />
            <Card title="LCD Display" class="flex-1 shrink-0">
                <LcdDisplay
                    controllerConnected={$controllerConnected}
                    lines={$workspace?.state.lcdLines}
                    elapsedSeconds={$workspace?.state.elapsedSeconds}
                />
            </Card>
        </Pane>
        <Pane minSize={30}>
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
