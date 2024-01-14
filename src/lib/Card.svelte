<script lang="ts">
    import { setContext } from "svelte";
    import { twMerge } from "tailwind-merge";
    import Button, { buttonStyle, type ButtonContext } from "./Button.svelte";
    import WithContext from "./WithContext.svelte";
    export let title: string | undefined = undefined;
    export let titleCentered = false;
    let className = "";
    export { className as class };
</script>

<div
    class={twMerge(
        "flex flex-col gap-4 rounded-[10px] border bg-white px-6 py-4 shadow-lg dark:border-white/20 dark:bg-zinc-900 dark:bg-opacity-80",
        className,
    )}
>
    <div class="flex w-full">
        {#if title}
            <h2
                class={twMerge(
                    "mb-1 text-xl font-bold",
                    titleCentered && "self-center",
                )}
            >
                {title}
            </h2>
        {/if}
        <div class="flex flex-1 justify-end">
            <WithContext ctx={buttonStyle} value={{ plain: true }}>
                <slot name="actions" />
            </WithContext>
        </div>
    </div>
    <slot />
</div>
