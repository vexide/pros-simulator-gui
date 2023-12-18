<script context="module" lang="ts">
    export type ButtonContext =
        | {
              plain?: boolean;
              large?: boolean;
          }
        | undefined;
    export const buttonStyle = Symbol("button-style");
</script>

<script lang="ts">
    import { twMerge } from "tailwind-merge";
    import { getContext, onMount, type ComponentType } from "svelte";
    const context = getContext<ButtonContext | undefined>(buttonStyle);
    export let large = context?.large ?? false;
    export let primary = false;
    export let disabled = false;
    export let plain = context?.plain ?? false;
    export let title: string | undefined = undefined;
    export let icon: ComponentType | undefined = undefined;
    export let iconColor = "currentColor";
    let className = "";
    export { className as class };

    let button: HTMLButtonElement;
    onMount(() => {
        if (primary) {
            const listener = (event: KeyboardEvent) => {
                console.log(event.key);
                if (event.key === "Enter") {
                    button.click();
                }
            };
            document.addEventListener("keydown", listener);
            return () => {
                document.removeEventListener("keydown", listener);
            };
        }
    });
</script>

<button
    bind:this={button}
    {title}
    class={twMerge(
        "flex items-center gap-2 rounded-lg border bg-white px-4 shadow shadow-neutral-500/10 active:bg-neutral-300 dark:border-none dark:bg-neutral-600 dark:shadow-black/30 dark:active:bg-neutral-500",
        large && "py-1.5",
        primary &&
            !disabled &&
            "bg-gradient-to-b from-blue-500/90 to-blue-600/90 text-white shadow active:bg-blue-600 active:text-blue-100",
        primary && "font-semibold",
        disabled &&
            "pointer-events-none bg-neutral-100 text-black/50 shadow-neutral-500/10 transition-colors dark:bg-neutral-800 dark:text-white/50",
        plain &&
            "self-baseline border-neutral-200 bg-transparent shadow-none dark:border-solid dark:border-white/20 dark:bg-transparent dark:active:bg-neutral-500/50",
        className,
    )}
    type="button"
    {disabled}
    on:click
>
    {#if icon}
        <svelte:component
            this={icon}
            class="h-5 w-5"
            color={disabled ? "currentColor" : iconColor}
        />
    {/if}
    <slot />
</button>
