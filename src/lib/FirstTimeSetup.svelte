<script lang="ts">
    import Form from "./Form.svelte";
    import { getContext } from "svelte";
    import * as ctx from "../context.ts";
    import Button from "./Button.svelte";
    import Divider from "./Divider.svelte";
    import { exit } from "@tauri-apps/api/process";

    export let components: Map<string, boolean>;
    const dismiss = getContext<ctx.DismissContext>(ctx.dismiss);
</script>

<div class="p-8 font-normal">
    <div class="mb-10 text-center">
        <h2 class="mb-1 text-3xl font-bold">Welcome to PROS Simulator</h2>
        <p>
            Let's get you set up! Press Next to continue the app installation.
        </p>
    </div>
    <Form>
        {#each components as [name, installed] (name)}
            <div class="flex items-center justify-center gap-2">
                <p
                    aria-hidden="true"
                    role="presentation"
                    class={installed ? "text-green-500" : "text-red-500"}
                >
                    &#x25CF;
                </p>
                <p class="flex-1">
                    {name}
                    {installed ? "installed" : "not installed"}
                </p>
            </div>
        {/each}
    </Form>
</div>
<Divider />
<div class="flex justify-between self-stretch px-6 py-3">
    <Button
        onClick={() => {
            exit(0);
        }}
        large>Quit</Button
    >
    <div class="flex-1" />
    <Button
        onClick={() => {
            console.log("hi");
        }}
        large
        primary>Next</Button
    >
</div>
