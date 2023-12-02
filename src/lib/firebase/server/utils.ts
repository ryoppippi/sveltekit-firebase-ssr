import { PUBLIC_FIREBASE_API_KEY } from '$env/static/public';
import { verifyIdToken } from '@marplex/flarebase-auth/build/main/lib/google-oauth';
import { error } from '@sveltejs/kit';
import camelcaseKeys from 'camelcase-keys';
import type { DecodedIdToken } from '../types';
import { withQuery } from 'ufo';
import { ensure, is } from 'unknownutil';

/**
 * @description Refresh the token and the refreshToken
 *
 * @param refreshToken - refresh token
 * @returns - new token
 *
 */
export async function refreshAndGetToken(refreshToken: string): Promise<string | undefined> {
	const res = await fetch(
		withQuery('https://securetoken.googleapis.com/v1/token', { key: PUBLIC_FIREBASE_API_KEY }),
		{
			method: 'post',
			body: JSON.stringify({
				grant_type: 'refresh_token',
				refreshToken
			})
		}
	);
	if (res.status !== 200) {
		console.error({ text: await res.text() });
		throw error(res.status, 'failed to refresh token');
	}

	const { idToken } = camelcaseKeys(
		ensure(
			await res.json(),
			is.ObjectOf({
				id_token: is.String
			})
		)
	);

	return idToken;
}

export async function decodeToken(token: string): Promise<DecodedIdToken> {
	return (await verifyIdToken(token)) as unknown as DecodedIdToken;
}
