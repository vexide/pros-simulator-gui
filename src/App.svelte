<script lang="ts" context="module">
    import { isWindows10 } from "./detectWindows10.js";
    const windows10 = isWindows10();
</script>

<script lang="ts">
    import Card from "./lib/Card.svelte";
    import Button from "./lib/Button.svelte";
    import WorkspaceView from "./lib/WorkspaceView.svelte";
    import { open } from "@tauri-apps/api/dialog";
    import RecentWorkspaces from "./lib/RecentWorkspaces.svelte";
    import { workspace, Workspace } from "./workspace";
    import { appInstallStatus } from "./sidecar.ts";
    import FirstTimeSetup from "./lib/FirstTimeSetup.svelte";
    import Modal from "./lib/Modal.svelte";
    import { writable } from "svelte/store";
    import "./splitpanes.scss";
    import { onMount } from "svelte";

    let installInfo = appInstallStatus();
    let installModalOpen = writable(false);

    installInfo.then((info) => {
        if (info.some((installed) => !installed)) {
            $installModalOpen = true;
        }
    });

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

    onMount(() => {
        windows10.then((isWindows10) => {
            if (isWindows10) {
                document.body.classList.add("windows10");
            }
        });

        return () => {
            document.body.classList.remove("windows10");
        };
    });
</script>

<div class="flex h-full flex-col overflow-hidden text-black dark:text-white">
    {#await installInfo then components}
        {#if $workspace}
            <WorkspaceView />
        {:else}
            <div class="flex flex-1 items-center justify-center gap-4 p-4">
                <Modal open={installModalOpen}>
                    <FirstTimeSetup {components} />
                </Modal>
                <Card title="Get Started" titleCentered>
                    <div class="grid grid-cols-2 gap-4 self-stretch">
                        <Button on:click={pickWorkspace} class="flex-1"
                            >Open workspace</Button
                        >
                        <p class="secondary flex-1 text-center">
                            Or pick recent:
                        </p>
                    </div>
                    <RecentWorkspaces />
                </Card>
            </div>
        {/if}
    {/await}
</div>
