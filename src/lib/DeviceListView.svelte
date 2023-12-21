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
</script>

<Card title="Devices" class="min-w-[35ch]">
    {#each $controllers as controller, index (index)}
        <DeviceView
            {controller}
            id={index}
            type={controllerTypes[index]}
            onTypeChange={(type) => setType(index, type)}
        />
    {/each}
</Card>
