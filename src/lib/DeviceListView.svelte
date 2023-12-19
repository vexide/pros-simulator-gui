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
</script>

<Card title="Devices" class="min-w-[35ch]">
    {#each $controllers as controller, index (index)}
        <DeviceView {controller} id={index} />
    {/each}
</Card>
