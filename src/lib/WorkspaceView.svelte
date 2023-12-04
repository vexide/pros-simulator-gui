<script lang="ts">
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Card from "./Card.svelte";
    import Button from "./Button.svelte";
    import { Workspace } from "../workspace.ts";
    import Download from "./Download.svelte";
</script>

<div class="grid flex-1 grid-cols-2 gap-4 p-8">
    <Card title="Simulator">
        <div class="grid grid-cols-2 gap-4 self-stretch">
            <Button
                large
                onClick={() => {
                    Workspace.close();
                }}
            >
                Close workspace
            </Button>
            <Button large onClick={() => {}}>Start simulator</Button>
        </div>
        <Download />
    </Card>
    <Card title="LCD Display">...</Card>
    <Card title="Console" class="col-span-2">...</Card>
</div>
