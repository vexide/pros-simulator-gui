<script lang="ts">
    import Card from "../Card.svelte";
    import Form from "../Form.svelte";
    import controllers, {
        Controller,
        gamepadAnalog,
        gamepadDigital,
    } from "../../controllers.ts";
    import { twMerge } from "tailwind-merge";
    import { enabled } from "ansi-colors";
    import Divider from "../Divider.svelte";
    import Button from "../Button.svelte";
    import SegmentedControl from "../SegmentedControl.svelte";
    import { pairs } from "../../utils.ts";

    export let controller: Controller;
</script>

<div>
    <h2 class="text-sm">{controller.name}</h2>
    <ul class="mx-2 my-4 flex flex-wrap gap-2">
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
    </ul>
</div>
