<script lang="ts">
    import DeviceGrid from "./DeviceGrid.svelte";

    import Form from "./Form.svelte";
    import {
        getDeviceName,
        type Device,
        SmartDevice,
        MotorDevice,
        DeviceSpec,
        ports,
        ControllerDevice,
    } from "../smart-devices";
    import Button from "./Button.svelte";
    import type { Readable, Writable } from "svelte/store";
    import DeviceIcon from "./DeviceIcon.svelte";
    import { create } from "ansi-colors";
    import controllers, { filteredControllers } from "../controllers.ts";
    import ControllerDetails from "./devices/ControllerDetails.svelte";
    import { onMount } from "svelte";

    export let device: Writable<Device | null>;
    export let onDelete: () => void;
    export let registeredControllerIds: number[];

    let chosenSpec: DeviceSpec | null = null;
    let changingPort = false;
    let selectedControllerType = "";

    device.subscribe((device) => {
        if (device instanceof ControllerDevice) {
            selectedControllerType = device.isPartner ? "Partner" : "Master";
        }
    });
</script>

<Form class="max-w-sm">
    {#if $device}
        <div class="flex gap-4">
            <h2 class="font-bold">
                {getDeviceName($device.spec)}
                {#if changingPort}
                    — Choose Port
                {/if}
            </h2>
            <div class="flex-1"></div>
            {#if $device instanceof SmartDevice && !changingPort}
                <Button
                    on:click={() => {
                        changingPort = true;
                    }}>Port {$device.port + 1}</Button
                >
            {/if}
            {#if $device instanceof ControllerDevice}
                <select
                    bind:value={selectedControllerType}
                    on:change={(ev) => {
                        if ($device instanceof ControllerDevice) {
                            $device.isPartner =
                                selectedControllerType === "Partner";
                        }
                    }}
                >
                    <option>Master</option>
                    <option>Partner</option>
                </select>
            {/if}
        </div>

        {#if changingPort}
            <DeviceGrid
                onChoose={(port) => {
                    if ($device instanceof SmartDevice) {
                        $device.port = port;
                    }
                    changingPort = false;
                }}
            />
        {:else if $device instanceof MotorDevice}
            <Button
                on:click={() => {
                    if ($device instanceof MotorDevice) {
                        $device.reversed = !$device.reversed;
                    }
                }}>Reversed: {$device.reversed}</Button
            >
        {:else if $device instanceof ControllerDevice}
            {@const controller = $controllers[$device.controllerId]}
            {#if controller}
                <ControllerDetails {controller} />
            {/if}
        {/if}
    {:else}
        <div>
            <h2 class="mb-2 font-bold">
                {#if chosenSpec === DeviceSpec.Controller}
                    Pick Controller
                {:else if chosenSpec !== null}
                    Choose Port
                {:else}
                    Add Device
                {/if}
            </h2>

            {#if chosenSpec === DeviceSpec.Controller && registeredControllerIds.length <= 2}
                <ul class="flex w-full flex-wrap justify-center gap-4">
                    {#each $filteredControllers.filter((controller) => !registeredControllerIds.includes(controller.id)) as controller}
                        <li class="max-w-xs flex-1">
                            <Button
                                class="btn btn-primary flex w-full gap-4"
                                large
                                plain
                                on:click={() => {
                                    $device = new ControllerDevice(
                                        controller.id,
                                        registeredControllerIds.length !== 0,
                                    );
                                }}
                            >
                                <DeviceIcon
                                    spec={DeviceSpec.Controller}
                                    size={25}
                                />
                                {controller.name}
                            </Button>
                        </li>
                    {:else}
                        <p>
                            Connect {registeredControllerIds.length
                                ? "another"
                                : "a"} wireless or wired controller to configure
                            it.
                        </p>
                    {/each}
                </ul>
            {:else if chosenSpec !== null}
                <DeviceGrid
                    onChoose={() => {
                        if (chosenSpec !== null) {
                            device.set(SmartDevice.create(chosenSpec, 0));
                        }
                    }}
                />
            {:else}
                <ul class="flex w-full flex-wrap justify-center gap-4">
                    {#each [DeviceSpec.Controller, DeviceSpec.Motor].filter((device) => device !== DeviceSpec.Controller || registeredControllerIds.length < 2) as spec}
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
        <Button
            on:click={() => {
                chosenSpec = null;
                device.set(null);
                onDelete();
            }}
            destructive
        >
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
