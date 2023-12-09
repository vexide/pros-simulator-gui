<script lang="ts">
    import { onMount } from "svelte";
    import { Terminal } from "@xterm/xterm";
    import { FitAddon } from "@xterm/addon-fit";
    import { WebglAddon } from "@xterm/addon-webgl";
    import "@xterm/xterm/css/xterm.css";
    import { LinkProvider } from "xterm-link-provider";
    import { open } from "@tauri-apps/api/shell";

    const pathRegex =
        /(\.{0,2}|([a-zA-Z]):\\)(([^<>\/:\|\?\*\"\n]{1,}\\)([^<>\/:\|\?\*\"\n]{1,})|\/([A-z0-9\/\-\_\.]+))/g;

    let term: HTMLDivElement | undefined;
    export const terminal = new Terminal({
        convertEol: true,
        fontFamily: "ui-monospace, monospace",
    });
    const fitAddon = new FitAddon();
    const webgl = new WebglAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webgl);

    webgl.onContextLoss(() => {
        webgl.dispose();
    });

    terminal.registerLinkProvider(
        new LinkProvider(
            terminal,
            pathRegex,
            (e, text) => {
                const url = new URL(`file://${text}`);
                open(url.href);
            },
            {},
            0,
        ),
    );

    const resize = new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.target === term) {
                fitAddon.fit();
                console.log("fit");
            }
        }
    });
    onMount(() => {
        terminal.open(term!);
        fitAddon.fit();
        resize.observe(term!);
    });
</script>

<div class="relative h-full w-full">
    <div class="absolute inset-0 bg-black" bind:this={term} />
</div>
