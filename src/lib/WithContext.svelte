<script lang="ts">
    import { setContext } from "svelte";

    export let ctx: unknown;
    export let value: unknown;

    setContext(ctx, value);
</script>

<slot />
