<script lang="ts">
    import { setContext } from "svelte";

    export let tooltip: string;
    export let disabled = false;
    const enabled = !disabled;

    const iconCtx = {
        size: "14",
    };
    setContext("iconCtx", iconCtx);
</script>

<li>
    <button
        type="button"
        class="toolbar-item group disabled:pointer-events-none disabled:opacity-50"
        {disabled}
        title={tooltip}
    >
        <slot />
        <div
            class="rounded-lg bg-neutral-400 bg-opacity-0 px-4 py-1 hover:bg-opacity-50 group-active:bg-opacity-75 dark:bg-neutral-600 dark:bg-opacity-0"
        >
            <slot name="icon" />
        </div>
    </button>
</li>
