<script lang="ts">
    import { twMerge } from "tailwind-merge";
    import Card from "./Card.svelte";
    import { setContext } from "svelte";
    import * as ctx from "../context.ts";
    import type { Writable } from "svelte/store";

    export let open: Writable<boolean>;
    let className = "";
    export { className as class };

    setContext(ctx.dismiss, () => {
        $open = false;
    });
</script>

{#if $open}
    <div class="pointer-events-auto fixed inset-0 z-30" />
    <div
        class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-neutral-600/30 dark:bg-neutral-800/30"
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
