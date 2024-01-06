<script lang="ts">
    import { onMount } from "svelte";
    import "@xterm/xterm/css/xterm.css";
    import { workspace } from "../workspace.ts";

    let term: HTMLDivElement | undefined;

    onMount(() => {
        $workspace?.terminal.open(term!);
        $workspace?.fitAddon.fit();
        setTimeout(() => $workspace?.fitAddon.fit());

        const resizeHandler = () => {
            $workspace?.fitAddon.fit();
        };
        window.addEventListener("resize", resizeHandler);

        const focused = document.activeElement;
        $workspace?.terminal.focus();
        if (focused instanceof HTMLElement) {
            focused.focus();
        }
        return () => {
            window.removeEventListener("resize", resizeHandler);
            $workspace?.terminal.dispose();
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
