<script lang="ts">
    import { twMerge } from "tailwind-merge";
    import { getContext, onMount, type ComponentType } from "svelte";
    export let controls: [string, string][];
    export let currentSelection: string | undefined = undefined;
    let className = "";
    export { className as class };
</script>

<ul
    class="flex rounded-lg border bg-neutral-100 shadow-inner dark:bg-neutral-900"
>
    {#each controls as [value, label], index}
        <li
            class={twMerge(
                index !== 0 &&
                    "flex before:block before:h-4 before:self-center before:border-l",
            )}
        >
            <button
                type="button"
                class={twMerge(
                    "h-7 rounded-md px-2 active:bg-white/40 active:shadow-sm active:shadow-neutral-500/60 dark:active:bg-neutral-500/40",
                    currentSelection === value &&
                        "bg-white shadow-sm shadow-neutral-500/60 dark:bg-neutral-500",
                )}
                on:click={() => {
                    currentSelection = value;
                }}
            >
                {label}
            </button>
        </li>
    {/each}
</ul>
