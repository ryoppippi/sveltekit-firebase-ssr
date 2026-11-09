import { browser } from '$app/env';
import { getToken } from '#lib/firebase/client.svelte.ts';

export const load = async ({ data }) => {
	const { token: tokenFromCookie } = data;
	const tokenFromFirebaseClient = browser ? await getToken() : undefined;

	return {
		...data,
		token: tokenFromFirebaseClient ?? tokenFromCookie
	};
};
