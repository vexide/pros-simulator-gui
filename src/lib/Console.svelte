<script lang="ts">
    import { onMount } from "svelte";
    import "@xterm/xterm/css/xterm.css";
    import { workspace } from "../workspace.ts";

    let term: HTMLDivElement | undefined;

    // const resize = new ResizeObserver((entries) => {
    //     for (const entry of entries) {
    //         if (entry.target === term) {
    //             $workspace?.fitAddon.fit();
    //             console.log("fit");
    //         }
    //     }
    // });
    onMount(() => {
        $workspace?.terminal.open(term!);
        $workspace?.fitAddon.fit();
        setTimeout(() => $workspace?.fitAddon.fit());
        // resize.observe(term!);
        const focused = document.activeElement;
        $workspace?.terminal.focus();
        if (focused instanceof HTMLElement) {
            focused.focus();
        }
        return () => {
            // resize.disconnect();
            // $workspace?.terminal.dispose();
        };
    });
</script>

<div
    class="flex h-full w-full flex-col overflow-hidden rounded-lg bg-neutral-900 p-2 dark:bg-transparent"
>
    <div
        class="flex flex-1 flex-col justify-end overflow-hidden"
        bind:this={term}
    ></div>
</div>
