<script lang="ts">
    import Form from "./Form.svelte";
    import {
        getDeviceName,
        type Device,
        SmartDevice,
        MotorDevice,
    } from "../smart-devices";
    import Button from "./Button.svelte";
    import type { Writable } from "svelte/store";

    export let device: Writable<Device | null>;
    export let onDelete: () => void;
</script>

<Form>
    {#if $device}
        <div class="flex gap-4">
            <h2>{getDeviceName($device.spec)}</h2>
            {#if $device instanceof SmartDevice}
                <Button>Port {$device.port}</Button>
            {/if}
        </div>
        {#if $device instanceof MotorDevice}
            <Button
                on:click={() => {
                    if ($device instanceof MotorDevice) {
                        $device.reversed = !$device.reversed;
                    }
                }}>Reversed: {$device.reversed}</Button
            >
        {/if}
    {:else}
        <div>
            <h2 class="mb-2 font-bold">Add Device</h2>
            <ul class="flex flex-wrap gap-4">
                <li>
                    <Button
                        class="btn btn-primary"
                        on:click={() => {
                            device.set(null);
                        }}>Smart Device</Button
                    >
                </li>
                <li>
                    <Button
                        class="btn btn-primary"
                        on:click={() => {
                            device.set(new MotorDevice(1));
                        }}>Motor Device</Button
                    >
                </li>
            </ul>
        </div>
    {/if}
    <Button on:click={onDelete}>
        {#if $device}
            Delete
        {:else}
            Cancel
        {/if}
    </Button>
</Form>
