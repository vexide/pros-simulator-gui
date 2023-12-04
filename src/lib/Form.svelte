<script lang="ts">
    import { twMerge } from "tailwind-merge";
    let className = "";
    export { className as class };
</script>

<form
    class={twMerge(
        "relative flex flex-col gap-4 rounded-md border bg-stone-50 p-3",
        "[&>*:not(:last-child)]:after:absolute [&>*:not(:last-child)]:after:-bottom-[calc(0.5rem)] [&>*:not(:last-child)]:after:w-full [&>*:not(:last-child)]:after:border-b [&>*:not(:last-child)]:after:content-[''] [&>*]:relative",
        className,
    )}
>
    <slot />
</form>
