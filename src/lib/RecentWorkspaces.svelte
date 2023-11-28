<script lang="ts">
    import { database } from "../database.js";

    async function getRecents() {
        const db = await database();
        return await db.select(`
            SELECT * FROM recent_workspaces ORDER BY last_opened DESC LIMIT 5;
        `);
    }
    const recents = getRecents();
</script>

{#await recents then recents}
    {@debug recents}
    Done
{:catch error}
    Error: {error}
{/await}
