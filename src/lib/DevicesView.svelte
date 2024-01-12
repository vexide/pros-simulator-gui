<script lang="ts">
    import { get, writable, type Writable } from "svelte/store";
    import Card from "./Card.svelte";
    import {
        MotorDevice,
        type Device,
        type DeviceSpec,
    } from "../smart-devices.ts";
    import DeviceDetailsView from "./DeviceDetailsView.svelte";
    import Button from "./Button.svelte";
    import PlusSolid from "svelte-awesome-icons/PlusSolid.svelte";

    let devices: Writable<Device | null>[] = [];
</script>

<Card title="Devices" class="flex-1">
    <div slot="actions">
        <Button
            class="btn btn-primary"
            large
            title="Create new device"
            on:click={() => {
                if (!devices.some((d) => get(d) === null)) {
                    devices = [writable(null), ...devices];
                }
            }}
        >
            <PlusSolid size={15} />
        </Button>
    </div>
    <ul class="flex flex-wrap gap-4 overflow-y-auto pb-6">
        {#each devices as device}
            <DeviceDetailsView
                {device}
                onDelete={() => {
                    devices = devices.filter((d) => d !== device);
                }}
            />
        {/each}
    </ul>
</Card>
