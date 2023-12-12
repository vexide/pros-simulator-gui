<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import "@fontsource/dejavu-mono/400.css";
    import "@fontsource/dejavu-sans/400.css";
    import { workspace } from "../workspace.ts";
    import LcdButton from "./LcdButton.svelte";

    const gray = "#888";
    const darkGreen = "#323D13";
    const silver = "#ccc";
    const white = "#fff";
    const skyBlue = "#00aad6";
    const green = "#5ABC03";
    const black = "#000";
    const darkGray = "#152c42";

    const sans = '80px "DejaVu Sans"';
    const mono = '80px "DejaVu Mono"';

    const width = 1600;
    const height = 900;

    let container: HTMLDivElement;
    let lcd: HTMLDivElement;

    export let lines: string[] | undefined;
    export let elapsedSeconds: number = 0;

    onMount(() => {
        const observer = new ResizeObserver((entries) => {
            const { height } = entries[0].contentRect;
            container.style.width = `${(16 / 9) * height}px`;
            const scale = height / 486;
            lcd.style.transform = `scale(${scale})`;
        });
        observer.observe(container);
        return () => {
            observer.disconnect();
        };
    });
</script>

<div class="relative flex-1 self-center" bind:this={container}>
    <div
        class="absolute left-0 top-0 flex h-[486px] w-[864px] origin-top-left flex-col rounded-3xl bg-[#00aad6] font-lcd-sans text-5xl font-bold text-black"
        bind:this={lcd}
    >
        <div
            class="grid h-[4.25rem] grid-cols-2 place-content-center self-stretch [&>*]:px-4"
        >
            <p class="truncate">
                {$workspace?.name ?? "[no workspace]"}
            </p>
            <p>
                {Math.floor(elapsedSeconds / 60)}:{Math.floor(
                    elapsedSeconds % 60,
                )
                    .toString()
                    .padStart(2, "0")}
            </p>
        </div>
        {#if lines}
            <div
                class="relative flex flex-1 flex-col gap-6 overflow-hidden rounded-3xl bg-gradient-to-b from-[#888] to-[#ccc] p-12"
            >
                <div
                    class="pointer-events-none absolute inset-0 rounded-3xl border-4 border-[#152c42] border-opacity-25"
                ></div>
                <pre
                    class="flex flex-1 select-auto flex-col justify-center bg-[#5ABC03] px-2 align-middle text-4xl text-[#323D13] [&>*]:font-lcd-mono">{lines.join(
                        "\n",
                    )}</pre>
                <div class="flex gap-40 text-2xl">
                    <LcdButton />
                    <LcdButton />
                    <LcdButton />
                </div>
            </div>
        {:else}
            <div class="flex-1 rounded-b-3xl bg-black" />
        {/if}
    </div>
</div>
