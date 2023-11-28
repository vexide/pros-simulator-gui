<script lang="ts">
    export let onClick: () => void;
</script>

<button
    class="rounded-lg border px-4 shadow-sm active:bg-neutral-300 dark:border-none dark:bg-neutral-600 dark:active:bg-neutral-500"
    type="button"
    on:click={onClick}
>
    <slot />
</button>
