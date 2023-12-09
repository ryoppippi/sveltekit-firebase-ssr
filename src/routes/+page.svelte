<script lang="ts">
	import { signIn, signOut } from '$lib/firebase/client.svelte';
	import { isNullish } from 'unknownutil';

	// TODO: wait for eslint-plugin-svelte to support runes
	// eslint-disable-next-line no-undef
	const { data } = $props();

	// TODO: wait for eslint-plugin-svelte to support runes
	// eslint-disable-next-line no-undef
	const { decodedToken } = data;
</script>

{#if isNullish(decodedToken)}
	<button onclick={async () => await signIn('google')}> sign in</button>
{:else}
	<button onclick={async () => await signOut()}> sign out</button>
	<div>
		{#each Object.entries(decodedToken) as [key, value]}
			<table>
				<tbody>
					<tr>
						<th>{key}</th>
						<td>{value}</td>
					</tr>
				</tbody>
			</table>
		{/each}
	</div>
{/if}
