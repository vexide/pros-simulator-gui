<script lang="ts">
    import { database, type RecentWorkspace } from "../database.ts";
    import { Workspace, workspace } from "../workspace.ts";

    const recents = database.then<RecentWorkspace[]>(async (db) => {
        return await db.select(`
            SELECT * FROM recent_workspaces ORDER BY last_opened DESC LIMIT 5;
        `);
    });
</script>

{#await recents then recents}
    <ul class="flex flex-col">
        {#each recents as recent (recent.path)}
            <li class="inline-flex gap-6">
                <a
                    href="#"
                    on:click|preventDefault={() => {
                        Workspace.openRecent(recent);
                    }}
                >
                    {recent.name}
                </a>
                <p class="secondary">
                    {#await Workspace.displayPath(recent.path) then path}
                        {path}
                    {/await}
                </p>
            </li>
        {:else}
            <p class="secondary">Your recent workspaces will appear here.</p>
        {/each}
    </ul>
{:catch error}
    Failed to load recent workspaces: {error}
{/await}
