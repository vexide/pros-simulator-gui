<script lang="ts">
    import Form from "./Form.svelte";
    import { getContext } from "svelte";
    import * as ctx from "../context.ts";
    import Button from "./Button.svelte";
    import Divider from "./Divider.svelte";
    import { exit } from "@tauri-apps/api/process";
    import TransitionHeight from "./TransitionHeight.svelte";
    import type { Action } from "svelte/action";
    import type { TransitionConfig } from "svelte/transition";
    import { downloadServer } from '../sidecar.ts';

    const dismiss = getContext<ctx.DismissContext>(ctx.dismiss);
    enum Page {
        Welcome,
        Installing,
    }

    export let components: Map<string, boolean>;
    let page: Page = 0;
    let downloadProgress: number | undefined = 0;
    let downloadFinished = false;
    let download: Promise<void> | undefined;
    let error = "";
</script>

<TransitionHeight class="w-[30rem] p-8 font-normal">
    {#if page === Page.Welcome}
        <div class="mb-10 text-center">
            <h2 class="mb-1 text-3xl font-bold">Welcome to PROS Simulator</h2>
            <p>
                Let's get you set up! Press Next to continue the app
                installation.
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
    {:else if page === Page.Installing}
        <h2 class="mb-11 text-center text-3xl font-bold">
            {#if error}
                Installation failed
            {:else if downloadFinished}
                Installation finished
            {:else}
                Installing runtime
            {/if}
        </h2>
        <p class="secondary ml-4">
            {#if error}
                {error}
            {:else if downloadFinished}
                Done!
            {:else if downloadProgress === undefined}
                Extracting...
            {:else}
                Downloading...
            {/if}
        </p>
        {@const props =
            downloadProgress === undefined ? {} : { value: downloadProgress }}
        <progress class="w-full" {...props} max="1" />
    {/if}
</TransitionHeight>
<Divider />
<div class="sticky bottom-0 flex justify-between gap-3 self-stretch px-6 py-3">
    <Button
        onClick={() => {
            exit(0);
        }}
        large>Quit</Button
    >
    <div class="flex-1" />
    <Button
        onClick={() => {
            page -= 1;
        }}
        large
        disabled={page === Page.Welcome}
    >
        Back
    </Button>
    <Button
        onClick={() => {
            if (page === Page.Welcome) {
                page += 1;
                if (!download) {
                    download = downloadServer((progress) => {
                        downloadProgress = progress;
                    }).then(() => {
                        downloadFinished = true;
                        downloadProgress = 100;
                    }).catch((err) => {
                        error = err;
                        downloadProgress = 0;
                    });
                }
            } else {
                dismiss?.();
            }
        }}
        large
        primary
        disabled={page === Page.Installing && !downloadFinished}
    >
        {#if page === Page.Welcome}
            Next
        {:else}
            Finish
        {/if}
    </Button>
</div>
