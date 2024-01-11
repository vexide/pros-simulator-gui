<script lang="ts">
    import Card from "./Card.svelte";
    import Form from "./Form.svelte";
    import controllers, {
        Controller,
        gamepadAnalog,
        gamepadDigital,
    } from "../controllers.ts";
    import { twMerge } from "tailwind-merge";
    import { enabled } from "ansi-colors";
    import Divider from "./Divider.svelte";
    import Button from "./Button.svelte";
    import SegmentedControl from "./SegmentedControl.svelte";

    export let controller: Controller | null;
    export let id: number;
    export let type: "primary" | "secondary" | "none";

    export let onTypeChange: (value: string) => void;

    function pairs<T>(iter: Iterable<T>): [T, T][] {
        const result: [T, T][] = [];
        const empty = Symbol();
        let last: T | typeof empty = empty;
        for (const item of iter) {
            if (last !== empty) {
                result.push([last, item]);
                last = empty;
            } else {
                last = item;
            }
        }
        return result;
    }
</script>

<Form class="">
    <article class="flex flex-col items-start gap-2">
        <div class="flex gap-4 self-stretch">
            <h1 class="truncate font-bold">
                {controller?.name ?? `Controller #${id}`}
            </h1>
            <SegmentedControl
                controls={[
                    ["primary", "Primary"],
                    ["secondary", "Secondary"],
                    ["none", "Off"],
                ]}
                currentSelection={type}
                onChange={onTypeChange}
            />
        </div>
        {#if controller}
            <Divider />
            <h2>Analog Inputs</h2>
            <div class="flex gap-2">
                {#each pairs(gamepadAnalog) as [x, y]}
                    {@const xV = controller.analog.get(x) ?? 0}
                    {@const yV = controller.analog.get(y) ?? 0}
                    <div class="relative h-10 w-10 rounded-full border">
                        <div
                            class="absolute h-2 w-2 rounded-full bg-blue-500"
                            style="left: {xV * 50 + 50}%; top: {-yV * 50 +
                                50}%; transform: translate(-50%, -50%);"
                        ></div>
                    </div>
                {/each}
            </div>
            <h2>Buttons</h2>
            <div class="flex flex-wrap gap-2">
                {#each gamepadDigital as name}
                    {@const enabled = controller.digital.get(name) ?? false}
                    <div
                        class={twMerge(
                            "relative flex h-10 w-10 items-center justify-center rounded-xl border text-xs",
                            enabled && "bg-blue-500 text-white",
                        )}
                    >
                        {name}
                    </div>
                {/each}
            </div>
        {:else}
            <Divider />
            <p>Controller not connected</p>
        {/if}
    </article>
</Form>
