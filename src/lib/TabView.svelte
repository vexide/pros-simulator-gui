<script context="module" lang="ts">
    export class Tab {
        constructor(
            public label: string,
            public component: ComponentType,
            id?: string,
        ) {
            this.#id = id;
        }

        #id: string | undefined;

        get id() {
            return this.#id ?? this.label;
        }
    }
</script>

<script lang="ts">
    import type { ComponentType } from "svelte";
    import { twMerge } from "tailwind-merge";

    export let items: Tab[] = [];
    export let activeTab = items[0].id;
</script>

<ul>
    {#each items as tab}
        <li class={twMerge("", activeTab === tab.id ? "active" : "")}>
            <button on:click={() => (activeTab = tab.id)} type="button">
                {tab.label}
            </button>
        </li>
    {/each}
</ul>
{#each items as tab (tab.id)}
    {#if activeTab == tab.id}
        <div class="box">
            <svelte:component this={tab.component} />
        </div>
    {/if}
{/each}
