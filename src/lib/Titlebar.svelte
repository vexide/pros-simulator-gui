<script lang="ts">
    import { PlaySolid, Icon } from "svelte-awesome-icons";
    import { appWindow } from "@tauri-apps/api/window";
    import ToolbarItem from "./ToolbarItem.svelte";
    import { workspace } from "../workspace.ts";
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<header
    class="relative left-0 right-0 top-0 z-40 flex h-[38px] shrink-0 select-none items-center justify-end bg-[#F2F3F1] px-2 text-lg font-bold leading-none shadow [--button-bg-opacity:0.0] hover:[--button-bg-opacity:1.0] dark:bg-neutral-700"
    role="heading"
    aria-level="1"
    data-tauri-drag-region
>
    <h1
        class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-80"
    >
        {#if $workspace}
            {$workspace.name}
        {:else}
            PROS Simulator
        {/if}
    </h1>

    <ul class="px-2">
        <ToolbarItem tooltip="Start simulator">
            <PlaySolid slot="icon" />
            <span>Start</span>
        </ToolbarItem>
    </ul>
</header>
