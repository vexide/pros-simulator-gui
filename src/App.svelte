<script lang="ts">
    import Titlebar from "./lib/Titlebar.svelte";
    import Card from "./lib/Card.svelte";
    import Button from "./lib/Button.svelte";
    import WorkspaceView from "./lib/WorkspaceView.svelte";
    import { open } from "@tauri-apps/api/dialog";
    import RecentWorkspaces from "./lib/RecentWorkspaces.svelte";
    import { workspace, Workspace } from "./state";

    $: {
        if ($workspace) {
            localStorage.setItem("workspace", $workspace.path);
        } else {
            localStorage.removeItem("workspace");
        }
    }

    async function pickWorkspace() {
        const path = await open({
            directory: true,
            recursive: true,
            title: "Choose a workspace directory",
        });
        console.log(path);
        if (typeof path !== "string") return;
        Workspace.open(path);
    }
</script>

<div class="flex h-full flex-col text-black dark:text-white">
    <Titlebar />

    <div class="flex flex-1 items-center justify-center p-4">
        {#if $workspace}
            <WorkspaceView />
        {:else}
            <Card title="Get Started">
                <div
                    class="flex flex-grow items-baseline justify-evenly self-stretch"
                >
                    <Button onClick={pickWorkspace}>Open workspace</Button>
                    <p class="secondary">Or pick recent:</p>
                </div>
                <!-- <p class="secondary">
                    Your recent workspaces will appear here.
                </p> -->
                <ul class="flex flex-col">
                    <li class="inline-flex gap-6">
                        <a href="/">Clawbot</a>
                        <p class="secondary">~/Documents/Clawbot/</p>
                    </li>
                    <li class="inline-flex gap-6">
                        <a href="/">Chairbot</a>
                        <p class="secondary">~/Documents/Chairbot/</p>
                    </li>
                    <li class="inline-flex gap-6">
                        <a href="/">Fengerbot</a>
                        <p class="secondary">~/Documents/Fengerbot/</p>
                    </li>
                    <li class="inline-flex gap-6">
                        <a href="/">Rustbot</a>
                        <p class="secondary">~/Documents/Rustbot/</p>
                    </li>
                    <li class="inline-flex gap-6">
                        <a href="/">SafetyHazardBot</a>
                        <p class="secondary">~/Documents/SafetyHazardBot/</p>
                    </li>
                </ul>
                <RecentWorkspaces />
            </Card>
        {/if}
    </div>
</div>
