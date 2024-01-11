<script lang="ts" context="module">
    export interface PickableDevice {
        spec: DeviceSpec | null;
        description: string;
        onPick: () => void;
    }
</script>

<script lang="ts">
    import { twMerge } from "tailwind-merge";
    import { DeviceSpec, getDeviceName } from "../smart-devices.ts";
    import Form from "./Form.svelte";
    import Button from "./Button.svelte";
    import * as ctx from "../context.ts";
    import { getContext } from "svelte";
    import DeviceIcon from "./DeviceIcon.svelte";

    const dismiss = getContext<ctx.DismissContext>(ctx.dismiss);

    export let choices: PickableDevice[];
</script>

{#each choices as choice}
    <Form class="mx-auto mb-4 max-w-lg">
        <div class="flex flex-1 gap-4">
            <div class="self-center">
                <DeviceIcon spec={choice.spec} size={20} />
            </div>
            <div class="flex flex-col">
                <h2 class="text-2xl font-bold">{getDeviceName(choice.spec)}</h2>
                <p class="text-neutral-500">{choice.description}</p>
            </div>
            <div class="flex-1" />
            <Button
                on:click={() => {
                    choice.onPick();
                    dismiss?.();
                }}>+</Button
            >
        </div>
    </Form>
{/each}
