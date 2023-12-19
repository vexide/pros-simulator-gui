<script lang="ts">
    import Card from "./Card.svelte";
    import Form from "./Form.svelte";
    import controllers, {
        gamepadAnalog,
        gamepadDigital,
    } from "../controllers.ts";
    import { twMerge } from "tailwind-merge";
    import { enabled } from "ansi-colors";

    function pairs<T>(iter: Iterable<T>): [T, T][] {
        const result: [T, T][] = [];
        const empty = Symbol();
        let last: T | typeof empty = empty;
        for (const item of iter) {
            if (last !== empty) {
                result.push([last, item]);
                last = empty;
            } else {
                last = item;
            }
        }
        return result;
    }
</script>

<Card title="Devices" class="flex-1">
    {#each $controllers as controller, index (controller?.id ?? index)}
        <Form>
            {#if controller}
                <article>
                    <h1 class="font-bold">{controller.name}</h1>
                    <hr />
                    <h2>Analog Inputs</h2>
                    <div class="flex gap-4">
                        {#each pairs(gamepadAnalog) as [x, y]}
                            {@const xV = controller.analog.get(x) ?? 0}
                            {@const yV = controller.analog.get(y) ?? 0}
                            <div class="relative h-10 w-10 rounded-full border">
                                <div
                                    class="absolute h-2 w-2 rounded-full bg-blue-500"
                                    style="left: {xV * 50 + 50}%; top: {-yV *
                                        50 +
                                        50}%; transform: translate(-50%, -50%);"
                                ></div>
                            </div>
                        {/each}
                    </div>
                    <h2>Buttons</h2>
                    <div class="flex flex-wrap">
                        {#each gamepadDigital as name}
                            {@const enabled =
                                controller.digital.get(name) ?? false}
                            <div
                                class={twMerge(
                                    "relative flex h-10 w-10 items-center justify-center rounded-full border text-sm",
                                    enabled && "bg-blue-500",
                                )}
                            >
                                {name}
                            </div>
                        {/each}
                    </div>
                    <br />
                </article>
            {:else}
                <article>
                    <h1>{index}</h1>
                    <h2>Not connected</h2>
                </article>
            {/if}
        </Form>
    {/each}
</Card>
