<script context="module" lang="ts">
	export const prerender = true;
</script>

<script>
	import Header from '$lib/components/Header.svelte';
	import Main from '$lib/components/Main.svelte'
</script>

<div class="flex flex-col h-full">
  <Header />
  <Main />
</div>




