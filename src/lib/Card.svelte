<script lang="ts">
    export let title: string | undefined = undefined;
</script>

<div
    class="flex basis-[30rem] flex-col items-start gap-4 rounded-lg bg-white px-6 py-4 shadow-lg dark:border dark:border-white dark:border-opacity-20 dark:bg-zinc-900 dark:bg-opacity-80"
>
    {#if title}
        <h2 class="mb-1 self-center text-xl font-bold">{title}</h2>
    {/if}
    <slot />
</div>
