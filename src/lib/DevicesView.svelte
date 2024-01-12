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

    let devices: Writable<Device | null>[] = [];
</script>

<Card title="Devices" class="min-w-[35ch] flex-1">
    <div slot="actions">
        <Button
            class="btn btn-primary"
            on:click={() => {
                if (!devices.some((d) => get(d) === null)) {
                    devices = [...devices, writable(null)];
                }
            }}>Add</Button
        >
    </div>
    <ul>
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
