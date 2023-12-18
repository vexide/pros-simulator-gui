<script lang="ts">
    import type { getGamepads } from "tauri-plugin-gamepad-api";
    import Card from "./Card.svelte";
    import Form from "./Form.svelte";
    import controllers from "../controllers.ts";

    let controllerMap = new Map<string, Gamepad | null>();
    $: {
        const expectedIds = new Set(controllerMap.keys());
        for (const controller of $controllers) {
            if (controller) {
                expectedIds.delete(controller.id);
                controllerMap.set(controller.id, controller);
            }
        }
        for (const id of expectedIds) {
            controllerMap.set(id, null);
        }
        controllerMap = controllerMap;
    }
</script>

<Card title="Devices" class="flex-1">
    {#each controllerMap.values() as controller, index (controller?.id ?? index)}
        <Form>
            {#if controller}
                <div>
                    <h1>{controller.id}</h1>
                    <h2>Axes</h2>
                    <pre>{controller.axes}</pre>
                    <h2>Buttons</h2>
                    <pre>{controller.buttons.map((b) => b.pressed)}</pre>
                    <br />
                </div>
            {:else}
                <div>
                    <h1>{index}</h1>
                    <h2>Not connected</h2>
                </div>
            {/if}
        </Form>
    {/each}
</Card>
