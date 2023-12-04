<script lang="ts">
    import { writable } from "svelte/store";
    import { downloadServer } from "../sidecar.ts";
    import Button from "./Button.svelte";

    let downloadStatus = writable("");
    let download: Promise<void> | undefined;
</script>

{#if download}
    {#await download}
        <p>{$downloadStatus}</p>
    {:then}
        <p>Download finished</p>
    {:catch error}
        {@debug error}
        <p>Download failed: {error}</p>
    {/await}
{:else}
    <Button
        onClick={() => {
            download = downloadServer((progress) => {
                console.log("Status: ", progress);
                $downloadStatus = progress;
            });
        }}
        large
    >
        Download
    </Button>
{/if}
