<script lang="ts">
    import Gamepad2 from "svelte-lucide/Gamepad2.svelte";
    import CircleXmarkRegular from "svelte-awesome-icons/CircleXmarkRegular.svelte";
    import QuestionSolid from "svelte-awesome-icons/QuestionSolid.svelte";
    import { twMerge } from "tailwind-merge";
    import { DeviceSpec } from "../smart-devices.ts";

    export let spec: DeviceSpec | undefined;
    let className = "";
    export { className as class };
</script>

<button
    type="button"
    class={twMerge(
        "flex h-12 w-12 flex-col items-center justify-evenly rounded-md bg-neutral-500 p-1 leading-none dark:bg-neutral-800",
        spec !== undefined && "active:bg-neutral-600",
        className,
    )}
    disabled={spec === undefined}
>
    {#if spec !== undefined}
        {#if spec === DeviceSpec.Controller}
            <Gamepad2 size={25} />
        {:else}
            <span class="text-neutral-500">
                <CircleXmarkRegular size={15} />
            </span>
        {/if}
        <slot />
    {:else}
        <span class="text-neutral-500">
            <QuestionSolid size={15} />
        </span>
    {/if}
</button>
