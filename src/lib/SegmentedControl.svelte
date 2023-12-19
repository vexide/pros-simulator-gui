<script lang="ts">
    import { twMerge } from "tailwind-merge";
    import { getContext, onMount, type ComponentType } from "svelte";
    export let controls: [string, string][];
    export let currentSelection: string | undefined = undefined;
    let className = "";
    export { className as class };
</script>

<div class="flex flex-wrap rounded-lg border bg-neutral-100 shadow-inner">
    {#each controls as [value, label], index}
        <button
            type="button"
            class={twMerge(
                "h-7 rounded-md px-2  active:bg-white/40 active:shadow-sm active:shadow-neutral-500/60",
                currentSelection === value &&
                    "bg-white shadow-sm shadow-neutral-500/60",
                index !== 0 && "border-l",
            )}
            on:click={() => {
                currentSelection = value;
            }}
        >
            {label}
        </button>
    {/each}
</div>
