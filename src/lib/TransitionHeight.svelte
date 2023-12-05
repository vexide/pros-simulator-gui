<script lang="ts">
    import { twMerge } from "tailwind-merge";
    import { onMount, setContext } from "svelte";

    let className = "";
    export { className as class };
    let height = "auto";
    let inner: HTMLElement;

    onMount(() => {
        if (inner) {
            const resizeObserver = new ResizeObserver((entries) => {
                height = `${entries[0].contentRect.height}px`;
            });
            resizeObserver.observe(inner);

            return () => {
                resizeObserver.disconnect();
            };
        }
    });
</script>

<div
    class={twMerge(
        "box-content overflow-hidden transition-[height] duration-200",
        className,
    )}
    style="height: {height}"
>
    <div bind:this={inner} class="w-full">
        <slot />
    </div>
</div>
