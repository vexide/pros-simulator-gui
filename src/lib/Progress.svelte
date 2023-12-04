<script lang="ts">
    export let value: number;
    export let max: number;
</script>

<progress {value} {max} class="w-full"></progress>
