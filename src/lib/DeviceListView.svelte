<script lang="ts">
    import Card from "./Card.svelte";
    import Form from "./Form.svelte";
    import controllers, {
        gamepadAnalog,
        gamepadDigital,
    } from "../controllers.ts";
    import { twMerge } from "tailwind-merge";
    import { enabled } from "ansi-colors";
    import Divider from "./Divider.svelte";
    import Button from "./Button.svelte";
    import SegmentedControl from "./SegmentedControl.svelte";
    import DeviceView from "./DeviceView.svelte";
    import { writable } from "svelte/store";
    import type { ControllerStateMessage } from "../sidecar.ts";
    import { Workspace } from "../workspace.ts";

    let controllerTypes: ("primary" | "secondary" | "none")[] = Array.from(
        { length: $controllers.length },
        () => "none",
    );

    function setType(index: number, type: string) {
        let old = controllerTypes.findIndex((t) => t === type);
        if (old !== -1) {
            controllerTypes[old] = "none";
        }
        controllerTypes[index] = type as any;
        controllerTypes = controllerTypes;
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
                ws.sendInput(["ControllerUpdate", message]);
            });
        } else {
            latestMessage = message;
            updateTimeout = setTimeout(() => {
                Workspace.mutate((ws) => {
                    ws.sendInput(["ControllerUpdate", latestMessage]);
                });
            }, 20);
        }
    }

    $: {
        let primaryIndex = controllerTypes.findIndex((t) => t === "primary");
        let secondaryIndex = controllerTypes.findIndex(
            (t) => t === "secondary",
        );
        let primary = primaryIndex === -1 ? null : $controllers[primaryIndex];
        let secondary =
            secondaryIndex === -1 ? null : $controllers[secondaryIndex];
        update([primary?.toMessage() ?? null, secondary?.toMessage() ?? null]);
    }
</script>

<Card title="Devices" class="min-w-[35ch]">
    <ul class="overflow-y-scroll">
        {#each $controllers as controller, index (index)}
            <li class="mr-2">
                <DeviceView
                    {controller}
                    id={index}
                    type={controllerTypes[index]}
                    onTypeChange={(type) => setType(index, type)}
                />
            </li>
        {/each}
    </ul>
</Card>
