<script lang="ts">
    import { twMerge } from "tailwind-merge";
    let className = "";
    export { className as class };
</script>

<form
    class={twMerge(
        "relative flex flex-col gap-5 rounded-md border bg-stone-50 p-2.5 dark:border-white/20 dark:bg-stone-900",
        "[&>*:not(:last-child)]:after:absolute [&>*:not(:last-child)]:after:-bottom-[calc(1.25rem/2)] [&>*:not(:last-child)]:after:w-full [&>*:not(:last-child)]:after:border-b [&>*:not(:last-child)]:after:content-[''] [&>*:not(:last-child)]:after:dark:border-white/20 [&>*]:relative",
        className,
    )}
>
    <slot />
</form>
