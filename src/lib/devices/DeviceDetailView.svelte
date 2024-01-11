<script lang="ts">
    import type { DeviceDetail } from "./DeviceListView.svelte";
    import * as ctx from "../context.ts";
    import { getContext } from "svelte";

    const dismiss = getContext<ctx.DismissContext>(ctx.dismiss);

    export let device: DeviceDetail;
</script>

{#if device.controller}Controller{/if}
