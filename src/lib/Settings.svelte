<script lang="ts">
    import Form from "./Form.svelte";
    import { getContext } from "svelte";
    import * as ctx from "../context.ts";
    import SegmentedControl from "./SegmentedControl.svelte";
    import { darkMode } from "../dark-mode.ts";
    import type { Writable } from "type-fest";
    import Divider from "./Divider.svelte";
    import { get } from "svelte/store";
    import Button from "./Button.svelte";

    const dismiss = getContext<ctx.DismissContext>(ctx.dismiss);

    let darkModeState: string = get(darkMode);

    function save() {
        if ($darkMode !== darkModeState) {
            $darkMode = darkModeState as any;
        }
    }
</script>

<div class="w-[30rem] p-6 font-normal">
    <h2 class="mb-5 text-center text-3xl font-bold">Settings</h2>
    <Form>
        <div class="flex items-center gap-8">
            Appearance
            <div class="flex-1" />
            <SegmentedControl
                controls={[
                    ["auto", "Auto"],
                    ["light", "Light"],
                    ["dark", "Dark"],
                ]}
                currentSelection={darkModeState}
                onChange={(s) => (darkModeState = s)}
            ></SegmentedControl>
        </div>
    </Form>
</div>
<Divider />
<div class="sticky bottom-0 flex justify-between gap-3 self-stretch px-6 py-5">
    <div class="flex-1" />
    <Button
        on:click={() => {
            dismiss?.();
        }}
    >
        Cancel
    </Button>
    <Button
        on:click={() => {
            save();
            dismiss?.();
        }}
        primary
    >
        Save
    </Button>
</div>
