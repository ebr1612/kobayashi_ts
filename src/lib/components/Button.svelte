<script lang="ts">
  export let disabled = false
  export let fullWidth = false
</script>

<button
  class="Button flex items-center justify-center cursor-default rounded text-white px-3 py-1 transition-colors uppercase {disabled
    ? 'bg-gray-300'
    : 'bg-primary-light hover:bg-blue-500'}  {fullWidth && 'w-full'}"
  {disabled}
  on:click
>
  <slot />
</button>
