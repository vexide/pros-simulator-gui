<script context="module" lang="ts">
    export type ButtonContext =
        | {
              large: boolean;
          }
        | undefined;
    export const buttonStyle = Symbol("button-style");
</script>

<script lang="ts">
    import { twMerge } from "tailwind-merge";
    import { getContext, onMount } from "svelte";
    const context = getContext<ButtonContext | undefined>(buttonStyle);
    export let onClick: () => void;
    export let large = context?.large ?? false;
    export let primary = false;
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
    class={twMerge(
        "rounded-lg border bg-white px-4 shadow-sm active:bg-neutral-300 dark:border-none dark:bg-neutral-600 dark:active:bg-neutral-500",
        large && "py-1.5",
        primary &&
            "bg-gradient-to-b from-blue-500/90 to-blue-600/90 font-semibold text-white shadow-sm active:bg-blue-600 active:text-blue-100",
        className,
    )}
    type="button"
    on:click={onClick}
>
    <slot />
</button>
