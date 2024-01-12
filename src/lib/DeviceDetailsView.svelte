<script lang="ts">
    import Form from "./Form.svelte";
    import {
        getDeviceName,
        type Device,
        SmartDevice,
        MotorDevice,
        DeviceSpec,
        ports,
    } from "../smart-devices";
    import Button from "./Button.svelte";
    import type { Writable } from "svelte/store";
    import DeviceIcon from "./DeviceIcon.svelte";
    import { create } from "ansi-colors";

    export let device: Writable<Device | null>;
    export let onDelete: () => void;

    let chosenSpec: DeviceSpec | null = null;
</script>

<Form class="max-w-sm">
    {#if $device}
        <div class="flex gap-4">
            <h2 class="font-bold">{getDeviceName($device.spec)}</h2>
            {#if $device instanceof SmartDevice}
                <div class="flex-1"></div>
                <Button>Port {$device.port + 1}</Button>
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
            <h2 class="mb-2 font-bold">
                {#if chosenSpec === DeviceSpec.Controller}
                    Configure Controller
                {:else if chosenSpec !== null}
                    Choose Port
                {:else}
                    Add Device
                {/if}
            </h2>

            {#if chosenSpec === DeviceSpec.Controller}
                TODO
            {:else if chosenSpec !== null}
                <div class="flex"></div>
                <ul class="m-2 grid grid-cols-7 grid-rows-3 gap-2">
                    {#each ports as port}
                        <Button
                            large
                            on:click={() => {
                                if (chosenSpec !== null) {
                                    device.set(
                                        SmartDevice.create(chosenSpec, port),
                                    );
                                }
                            }}
                        >
                            {port + 1}
                        </Button>
                    {/each}
                </ul>
            {:else}
                <ul class="flex w-full flex-wrap justify-center gap-4">
                    {#each [DeviceSpec.Controller, DeviceSpec.Motor] as spec}
                        <li class="max-w-xs flex-1">
                            <Button
                                class="btn btn-primary flex w-full gap-4"
                                large
                                plain
                                on:click={() => {
                                    chosenSpec = spec;
                                }}
                            >
                                <DeviceIcon {spec} size={25} />
                                {getDeviceName(spec)}
                            </Button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
    <div class="flex w-full">
        <Button on:click={onDelete} destructive>
            {#if $device}
                Delete
            {:else}
                Cancel
            {/if}
        </Button>
        <div class="flex-1"></div>
        {#if chosenSpec !== null && $device === null}
            <Button
                on:click={() => {
                    chosenSpec = null;
                }}
            >
                Back
            </Button>
        {/if}
    </div>
</Form>
