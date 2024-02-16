<!--
@component
Picker for all possible smart device ports.

```tsx
<DeviceGrid onChoose={(port) => console.log(port)} />
```
-->

<script lang="ts">
    import { SmartDevice, ports } from "../smart-devices";
    import Button from "./Button.svelte";

    export let onChoose: (port: number) => void;
</script>

<ul class="m-2 grid grid-cols-7 grid-rows-3 gap-2">
    {#each ports as port}
        <Button
            large
            on:click={() => {
                onChoose(port);
            }}
        >
            {port + 1}
        </Button>
    {/each}
</ul>
