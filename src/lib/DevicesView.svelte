<script lang="ts">
    import { derived, get, writable, type Writable } from "svelte/store";
    import Card from "./Card.svelte";
    import {
        MotorDevice,
        type Device,
        DeviceSpec,
        ControllerDevice,
    } from "../smart-devices.ts";
    import DeviceDetailsView from "./DeviceDetailsView.svelte";
    import Button from "./Button.svelte";
    import PlusSolid from "svelte-awesome-icons/PlusSolid.svelte";
    import controllers, { filteredControllers } from "../controllers.ts";
    import TriangleExclamationSolid from "svelte-awesome-icons/TriangleExclamationSolid.svelte";

    let devices: Writable<Device | null>[] = [];
    $: registeredControllerIds = derived(devices, (devices) => {
        return devices
            .filter((d): d is ControllerDevice => d instanceof ControllerDevice)
            .map((d) => d.controllerId);
    });
    let nullControllers = get(controllers).filter((c) => c === null).length;

    function removeDevice(device: Writable<Device | null>) {
        devices = devices.filter((d) => d !== device);
    }

    function createDevice() {
        nullControllers = get(controllers).filter((c) => c === null).length;
        if (!devices.some((d) => get(d) === null)) {
            const newDevice = writable<Device | null>(null);
            filteredControllers.subscribe((controllers) => {
                const device = get(newDevice);
                if (device instanceof ControllerDevice) {
                    if (
                        !controllers.some((c) => c.id === device.controllerId)
                    ) {
                        removeDevice(newDevice);
                    }
                }
            });
            devices = [newDevice, ...devices];
        }
    }
</script>

<Card title="Devices" class="flex-1">
    <div slot="actions" class="flex items-center gap-4">
        {#if $controllers.filter((c) => c === null).length > nullControllers}
            <!-- This warning shows up when a controller is unplugged and is dismissed by clicking on it. -->
            <button
                type="button"
                class="flex cursor-pointer items-center gap-2 text-sm text-orange-500 underline"
                on:click={() => {
                    nullControllers = $controllers.filter(
                        (c) => c === null,
                    ).length;
                }}
            >
                <TriangleExclamationSolid size={12} />
                Controller disconnected
            </button>
        {/if}
        <Button
            class="btn btn-primary"
            large
            title="Create new device"
            on:click={createDevice}
        >
            <PlusSolid size={15} />
        </Button>
    </div>
    <ul class="flex flex-wrap gap-4 overflow-y-auto pb-6">
        {#each devices as device}
            {#key device}
                <DeviceDetailsView
                    {device}
                    registeredControllerIds={$registeredControllerIds}
                    onDelete={() => {
                        removeDevice(device);
                    }}
                />
            {/key}
        {/each}
    </ul>
</Card>
