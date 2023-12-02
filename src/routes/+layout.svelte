<script lang="ts">
	import { PUBLIC_FIREBASE_API_KEY, PUBLIC_FIREBASE_PROJECT_ID } from '$env/static/public';
	import { init, Loading, type FirebaseOptions } from '$lib/firebase/client.svelte';
	// TODO: wait for eslint-plugin-svelte to support runes
	// eslint-disable-next-line no-undef
	const { children, data } = $props();

	const loading = new Loading();

	const firebaseConfig = {
		projectId: PUBLIC_FIREBASE_PROJECT_ID,
		apiKey: PUBLIC_FIREBASE_API_KEY,
		authDomain: `${PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`
	} as const satisfies FirebaseOptions;

	// TODO: wait for eslint-plugin-svelte to support runes
	// eslint-disable-next-line no-undef
	$effect(() => {
		init(firebaseConfig, data.token);
	});
</script>

{#if loading.value}
	<div>loading...</div>
{/if}
{@render children()}
