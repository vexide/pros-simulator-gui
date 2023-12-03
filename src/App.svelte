<script lang="ts">
    import Titlebar from "./lib/Titlebar.svelte";
    import Card from "./lib/Card.svelte";
    import Button from "./lib/Button.svelte";
    import WorkspaceView from "./lib/WorkspaceView.svelte";
    import { open } from "@tauri-apps/api/dialog";
    import RecentWorkspaces from "./lib/RecentWorkspaces.svelte";
    import { workspace, Workspace } from "./workspace";

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

    {#if $workspace}
        <WorkspaceView />
    {:else}
        <div class="flex flex-1 items-center justify-center gap-4 p-4">
            <Card title="Get Started">
                <div class="grid grid-cols-2 gap-4 self-stretch">
                    <Button onClick={pickWorkspace} class="flex-1"
                        >Open workspace</Button
                    >
                    <p class="secondary flex-1 text-center">Or pick recent:</p>
                </div>
                <RecentWorkspaces />
            </Card>
        </div>
    {/if}
</div>
