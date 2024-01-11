<script lang="ts">
    import Card from "./Card.svelte";
    import Form from "./Form.svelte";
    import controllers, {
        Controller,
        gamepadAnalog,
        gamepadDigital,
    } from "../controllers.ts";
    import { twMerge } from "tailwind-merge";
    import { enabled } from "ansi-colors";
    import Divider from "./Divider.svelte";
    import Button from "./Button.svelte";
    import SegmentedControl from "./SegmentedControl.svelte";
    import DeviceView from "./DeviceView.svelte";
    import { writable, derived } from "svelte/store";
    import TriangleExclamationSolid from "svelte-awesome-icons/TriangleExclamationSolid.svelte";
    import type { ControllerStateMessage } from "../sidecar.ts";
    import { Workspace } from "../workspace.ts";

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
</script>

<Card title="Devices" class="min-w-[35ch]">
    <p slot="actions" class="flex items-center gap-1 text-orange-500">
        {#if filteredControllers.length === 0 && $controllers.length > 0}
            <TriangleExclamationSolid size={12} />
            Controller Disconnected
        {/if}
    </p>
    <ul class="overflow-y-auto">
        {#each filteredControllers as controller, _ (controller.id)}
            <li class="mr-2">
                <DeviceView
                    {controller}
                    id={controller.id}
                    type={$controllerTypes[controller.id] ?? "none"}
                    onTypeChange={(type) => setType(controller.id, type)}
                />
            </li>
        {:else}
            <p class="secondary">
                Connect a wired or Bluetooth controller to configure.
            </p>
        {/each}
    </ul>
</Card>
