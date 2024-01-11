<script lang="ts">
    import Gamepad2 from "svelte-lucide/Gamepad2.svelte";
    import { DeviceSpec } from "../smart-devices.ts";
    import BoltSolid from "svelte-awesome-icons/BoltSolid.svelte";
    import CircleXmarkRegular from "svelte-awesome-icons/CircleXmarkRegular.svelte";
    import QuestionSolid from "svelte-awesome-icons/QuestionSolid.svelte";

    export let spec: DeviceSpec | null | undefined;
    export let size: number;
</script>

{#if spec !== undefined}
    {#if spec === DeviceSpec.Controller}
        <Gamepad2 size={size + 10} />
    {:else if spec == DeviceSpec.Motor}
        <BoltSolid {size} />
    {:else}
        <span class="text-neutral-500">
            <CircleXmarkRegular {size} />
        </span>
    {/if}
    <slot />
{:else}
    <span class="text-neutral-500">
        <QuestionSolid {size} />
    </span>
{/if}
