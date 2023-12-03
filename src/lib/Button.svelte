<script lang="ts">
    import { twMerge } from "tailwind-merge";
    export let onClick: () => void;
    export let large = false;
    let className = "";
    export { className as class };
</script>

<button
    class={twMerge(
        "rounded-lg border bg-white px-4 shadow-sm active:bg-neutral-300 dark:border-none dark:bg-neutral-600 dark:active:bg-neutral-500",
        large && "py-2",
        className,
    )}
    type="button"
    on:click={onClick}
>
    <slot />
</button>
