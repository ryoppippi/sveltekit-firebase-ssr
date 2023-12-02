import { browser } from '$app/environment';
import { getToken } from '$lib/firebase/client.svelte';

export const load = async ({ data }) => {
	const { token: tokenFromCookie } = data;
	const tokenFromFirebaseClient = browser ? await getToken() : undefined;

	return {
		...data,
		token: tokenFromFirebaseClient ?? tokenFromCookie
	};
};
