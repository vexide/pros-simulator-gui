<script lang="ts" context="module">
    export interface DeviceDetail {
        controller: boolean;
        port: number;
    }
</script>

<script lang="ts">
    import DeviceButton from "./DeviceButton.svelte";

    import Card from "./Card.svelte";
    import Form from "./Form.svelte";
    import controllers, {
        Controller,
        gamepadAnalog,
        gamepadDigital,
    } from "../controllers.ts";
    import { twMerge } from "tailwind-merge";
    import { writable, derived } from "svelte/store";
    import TriangleExclamationSolid from "svelte-awesome-icons/TriangleExclamationSolid.svelte";
    import type { ControllerStateMessage } from "../sidecar.ts";
    import { Workspace } from "../workspace.ts";
    import { DeviceSpec, getDeviceName } from "../smart-devices.ts";
    import WithContext from "./WithContext.svelte";
    import { dismiss } from "../context.ts";
    import DeviceDetailView from "./DeviceDetailView.svelte";
    import Button from "./Button.svelte";
    import DevicePicker, { type PickableDevice } from "./DevicePicker.svelte";

    const controllerTypes = writable<("primary" | "secondary" | "none")[]>(
        Array.from({ length: $controllers.length }, () => "none"),
    );

    export const controllerConnected = derived(
        [controllers, controllerTypes],
        ([controllers, controllerTypes]) => {
            return controllers.some(
                (c) =>
                    c &&
                    controllerTypes[c.id] &&
                    controllerTypes[c.id] !== "none",
            );
        },
    );

    function setType(index: number, type: string) {
        let old = $controllerTypes.findIndex((t) => t === type);
        if (old !== -1) {
            $controllerTypes[old] = "none";
        }
        $controllerTypes[index] = type as any;
        controllerTypes.set($controllerTypes);
    }

    let lastUpdate = 0;
    let updateTimeout: number | undefined;
    let latestMessage: [
        ControllerStateMessage | null,
        ControllerStateMessage | null,
    ];

    function update(
        message: [ControllerStateMessage | null, ControllerStateMessage | null],
    ) {
        const now = Date.now();
        clearTimeout(updateTimeout);
        if (now - lastUpdate >= 20) {
            Workspace.mutate((ws) => {
                ws.sendMessage("ControllerUpdate", message);
            });
        } else {
            latestMessage = message;
            updateTimeout = setTimeout(() => {
                Workspace.mutate((ws) => {
                    ws.sendMessage("ControllerUpdate", latestMessage);
                });
            }, 20);
        }
    }

    $: {
        let primaryIndex = $controllerTypes.findIndex((t) => t === "primary");
        let secondaryIndex = $controllerTypes.findIndex(
            (t) => t === "secondary",
        );
        let primary = primaryIndex === -1 ? null : $controllers[primaryIndex];
        let secondary =
            secondaryIndex === -1 ? null : $controllers[secondaryIndex];
        update([primary?.toMessage() ?? null, secondary?.toMessage() ?? null]);
    }

    $: filteredControllers = $controllers.filter<Controller>(
        (x): x is Controller => x !== null,
    );

    const ports = Array.from({ length: 21 }).map((_, i) => i);

    let openDetailView: DeviceDetail | undefined = undefined;
    let pickerShown = false;

    let proposedPickable: PickableDevice | undefined = undefined;
    let proposedControllerId: number | undefined = undefined;

    let connectedDevices: (DeviceSpec | null)[] = ports.map(() => null);
</script>

<Card title="Devices" class="min-w-[35ch] flex-1">
    <div slot="actions">
        <p class="flex items-center gap-1 text-orange-500">
            {#if filteredControllers.length === 0 && $controllers.length > 0}
                <TriangleExclamationSolid size={12} />
                Controller Disconnected
            {/if}
        </p>

        <Button on:click={() => (pickerShown = !pickerShown)}>
            Toggle picker
        </Button>
    </div>
    <div class={twMerge("overflow-y-scroll", pickerShown ? "" : "self-center")}>
        {#if pickerShown}
            <WithContext ctx={dismiss} value={() => (pickerShown = false)}>
                <DevicePicker
                    choices={[
                        ...filteredControllers.map((controller) => {
                            return {
                                spec: DeviceSpec.Controller,
                                description: `Controller ${controller.id + 1}`,
                                onPick() {
                                    proposedPickable = this;
                                    proposedControllerId = controller.id;
                                },
                            };
                        }),
                        {
                            spec: DeviceSpec.Motor,
                            description: "V5 Smart Motor",
                            onPick() {
                                proposedPickable = this;
                            },
                        },
                        {
                            spec: null,
                            description: "Disable this device",
                            onPick() {
                                proposedPickable = this;
                            },
                        },
                    ]}
                />
            </WithContext>
        {:else if $openDetailView}
            <WithContext
                ctx={dismiss}
                value={() => ($openDetailView = undefined)}
            >
                <DeviceDetailView device={$openDetailView} />
            </WithContext>
        {:else}
            <ul class="m-2 grid grid-cols-7 grid-rows-4 gap-4">
                <DeviceButton
                    spec={DeviceSpec.Controller}
                    on:click={() => {
                        openDetailView = {
                            controller: true,
                            port: 2,
                        };
                    }}>2</DeviceButton
                >
                <DeviceButton
                    spec={DeviceSpec.Controller}
                    on:click={() => {
                        openDetailView = {
                            controller: true,
                            port: 1,
                        };
                    }}>1</DeviceButton
                >
                <DeviceButton spec={undefined}></DeviceButton>
                <DeviceButton spec={undefined}></DeviceButton>
                <DeviceButton spec={undefined}></DeviceButton>
                {#each ports as port}
                    <DeviceButton
                        spec={connectedDevices[port]}
                        class={twMerge(port === 0 && "col-[1]")}
                        on:click={() => {
                            if (proposedPickable) {
                                connectedDevices[port] = proposedPickable.spec;
                                proposedPickable = undefined;
                            }
                            openDetailView = {
                                controller: false,
                                port,
                            };
                        }}
                    >
                        {port + 1}
                    </DeviceButton>
                {/each}
            </ul>
            {#if proposedPickable !== undefined}
                Picking {getDeviceName(proposedPickable.spec)}
            {/if}
        {/if}
    </div>
</Card>
