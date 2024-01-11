<script lang="ts">
    import { onMount, afterUpdate } from "svelte";
    import "@fontsource/dejavu-mono/400.css";
    import "@fontsource/dejavu-sans/400.css";
    import "@fontsource/dejavu-sans/700.css";
    import { workspace, Workspace } from "../workspace.ts";
    import LcdButton from "./LcdButton.svelte";
    import LaptopCodeSolid from "svelte-awesome-icons/LaptopCodeSolid.svelte";
    import Gamepad from "svelte-lucide/Gamepad2.svelte";

    let container: HTMLDivElement;
    let lcd: HTMLDivElement;

    export let lines: string[] | undefined;
    export let elapsedSeconds = 0;
    export let controllerConnected: boolean;

    let presses: [boolean, boolean, boolean] = [false, false, false];

    const update = (button: number, value: boolean) => {
        presses[button] = value;
        presses = presses;
        Workspace.mutate((ws) => ws.sendMessage("LcdButtonsUpdate", presses));
    };

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
        class="absolute left-0 top-0 flex h-[486px] w-[864px] origin-top-left flex-col overflow-clip rounded-3xl bg-[#00aad6] font-lcd-sans text-5xl text-black"
        bind:this={lcd}
    >
        <div
            class="grid h-[4.25rem] grid-cols-3 place-content-center items-center self-stretch [&>*]:px-4"
        >
            <p class="truncate">
                {$workspace?.name ?? "[no workspace]"}
            </p>
            <p class="text-center">
                {Math.floor(elapsedSeconds / 60)}:{Math.floor(
                    elapsedSeconds % 60,
                )
                    .toString()
                    .padStart(2, "0")}
            </p>
            <div class="-mt-1 flex gap-4 place-self-end">
                {#if controllerConnected}
                    <div class="flex flex-col items-center">
                        <Gamepad size={45} />
                        <div class="-mt-1 flex items-center">
                            <div
                                class="h-5 w-7 border-2 border-black bg-[#93C83F]"
                            ></div>
                            <div class="h-1.5 w-1 bg-black"></div>
                        </div>
                    </div>
                    <div class="flex flex-col justify-end text-2xl text-white">
                        <div class="flex items-end gap-1">
                            {#each [0, 5, 10, 15, 20] as h}
                                <div
                                    class="w-1 bg-white"
                                    style="height: {h + 10}px;"
                                />
                            {/each}
                        </div>
                        <p class="text-center leading-none">S</p>
                    </div>
                {/if}
                <div class="flex flex-col items-center">
                    <LaptopCodeSolid size={45} />
                    <div class="-mt-1 flex items-center">
                        <div
                            class="h-5 w-7 border-2 border-black bg-[#93C83F]"
                        ></div>
                        <div class="h-1.5 w-1 bg-black"></div>
                    </div>
                </div>
            </div>
        </div>
        {#if lines}
            <div
                class="relative flex flex-1 flex-col gap-6 overflow-hidden rounded-3xl bg-gradient-to-b from-[#888] to-[#ccc] p-12"
            >
                <div
                    class="pointer-events-none absolute inset-0 rounded-3xl border-4 border-[#152c42] border-opacity-25"
                ></div>
                <pre
                    class="flex flex-1 cursor-auto select-text flex-col justify-center bg-[#5ABC03] px-2 align-middle text-4xl text-[#323D13] [&>*]:font-lcd-mono">{lines.join(
                        "\n",
                    )}</pre>
                <div class="flex gap-40 text-2xl">
                    {#each [0, 1, 2] as button}
                        <LcdButton
                            on:mousedown={() => {
                                update(button, true);
                            }}
                            on:mouseup={() => {
                                update(button, false);
                            }}
                        />
                    {/each}
                </div>
            </div>
        {:else}
            <div class="flex-1 rounded-b-3xl bg-black" />
        {/if}
    </div>
</div>
