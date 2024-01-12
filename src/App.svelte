<script lang="ts" context="module">
    import { requiresOpaqueBackground } from "./detectTransparencySupport.js";
    const opaque = requiresOpaqueBackground();
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
    import GearSolid from "svelte-awesome-icons/GearSolid.svelte";
    import Settings from "./lib/Settings.svelte";
    import { getVersion } from "@tauri-apps/api/app";

    let installInfo = appInstallStatus();
    let installModalOpen = writable(false);
    let settingsModalOpen = writable(false);

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
        opaque.then((opaque) => {
            if (!opaque) {
                document.body.classList.remove("opaque");
            }
        });

        return () => {
            document.body.classList.add("opaque");
        };
    });
</script>

<div class="flex h-full flex-col overflow-hidden text-black dark:text-white">
    {#await installInfo then components}
        <Modal open={installModalOpen}>
            <FirstTimeSetup {components} />
        </Modal>
        <Modal open={settingsModalOpen}>
            <Settings />
        </Modal>
        {#await getVersion() then version}
            {#if version.includes("-")}
                <p class="secondary fixed bottom-0 right-3 text-xs">
                    v{version}
                </p>
            {/if}
        {/await}
        {#if $workspace}
            <WorkspaceView {settingsModalOpen} />
        {:else}
            <Button
                class="absolute right-3 top-3 flex items-center justify-center p-2.5"
                large
                title="Settings"
                on:click={() => {
                    $settingsModalOpen = true;
                }}
                icon={GearSolid}
            />
            <div class="flex flex-1 items-center justify-center gap-4 p-4">
                <Card title="Get Started" titleCentered>
                    <div class="grid grid-cols-2 gap-4 self-stretch">
                        <Button on:click={pickWorkspace} class="flex-1">
                            Open workspace
                        </Button>
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
