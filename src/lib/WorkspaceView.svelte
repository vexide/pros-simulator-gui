<script lang="ts">
    import { getContext } from "svelte";
    import type { Writable } from "svelte/store";
    import Card from "./Card.svelte";
    import Button from "./Button.svelte";
    import { Workspace } from "../workspace.ts";
</script>

<Card title="Settings">
    <Button
        onClick={() => {
            Workspace.close();
        }}>Close workspace</Button
    >
</Card>
<Card>LCD Display</Card>
