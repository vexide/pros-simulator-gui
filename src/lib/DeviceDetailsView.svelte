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

    export let device: Writable<Device>;
    export let onDelete: () => void;
</script>

<Form>
    <div class="flex">
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
    <Button on:click={onDelete}>Delete</Button>
</Form>
