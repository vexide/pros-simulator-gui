<script lang="ts">
    import { twMerge } from "tailwind-merge";
    import Card from "./Card.svelte";
    import { onMount, setContext } from "svelte";
    import * as ctx from "../context.ts";
    import type { Writable } from "svelte/store";

    export let open: Writable<boolean>;
    let inDom = false;
    let className = "";
    let fadeOutTimeout: number | undefined;
    export { className as class };

    $: {
        if ($open) {
            clearTimeout(fadeOutTimeout);
            inDom = true;
        } else {
            fadeOutTimeout = setTimeout(() => {
                inDom = false;
                fadeOutTimeout = undefined;
            }, 200);
        }
    }

    onMount(() => {
        return () => {
            clearTimeout(fadeOutTimeout);
        };
    });

    setContext(ctx.dismiss, () => {
        $open = false;
    });
</script>

{#if inDom}
    <div class="pointer-events-auto fixed inset-0 z-30" />
    <div
        class={twMerge(
            "pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-neutral-600/30 transition-opacity duration-200 dark:bg-black/40",
            !$open && "opacity-0",
        )}
    >
        <Card
            class={twMerge(
                "pointer-events-auto gap-0 overflow-hidden border border-neutral-500 border-opacity-50 p-0 shadow-xl shadow-black/20 dark:bg-opacity-100 dark:shadow-black/70",
                className,
            )}
        >
            <slot />
        </Card>
    </div>
{/if}
