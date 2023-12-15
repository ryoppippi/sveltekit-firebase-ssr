import type { Cookies, Handle } from '@sveltejs/kit';
import type { DecodedIdToken, DecodeTokenError } from './types';

import { is, ensure, assert } from 'unknownutil';
import { to } from 'await-to-js';

import { error } from '@sveltejs/kit';
import { PUBLIC_FIREBASE_API_KEY } from '$env/static/public';
import { verifyIdToken } from '@marplex/flarebase-auth/build/main/lib/google-oauth';
import camelcaseKeys from 'camelcase-keys';
import { withQuery } from 'ufo';

export const TOKEN_COOKIE_NAME = 'token' as const satisfies string;
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken' as const satisfies string;

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
		error(res.status, 'failed to refresh token');
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

export const cookieOptions = {
	path: '/',
	httpOnly: true,
	maxAge: 60 * 60 * 24 * 7
} as const satisfies Parameters<Cookies['set']>[2];

export function deleteToken({ cookies }: { cookies: Cookies }) {
	cookies.delete(TOKEN_COOKIE_NAME, cookieOptions);
	cookies.delete(REFRESH_TOKEN_COOKIE_NAME, cookieOptions);
}

export function setToken({
	cookies,
	token,
	refreshToken
}: {
	cookies: Cookies;
	token: string;
	refreshToken: string;
}) {
	assert(token, is.String);
	assert(refreshToken, is.String);
	cookies.set(TOKEN_COOKIE_NAME, token, cookieOptions);
	cookies.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, cookieOptions);
}

/**
 * firebase sveltekit handler
 * if token found, decode it and set it in event.locals
 * if token is expired, get new token from refreshToken and set it in event.locals
 */
export const firebaseHandler = (async ({ event, resolve }) => {
	const { cookies } = event;

	const token = cookies.get(TOKEN_COOKIE_NAME);
	const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE_NAME);

	if (!is.String(token)) {
		return resolve(event);
	}

	const [err, decodedToken] = await to<DecodedIdToken, DecodeTokenError>(decodeToken(token));

	/** if the token is valid, set it  */
	if (!err) {
		event.locals.token = ensure(token, is.String);
		event.locals.refreshToken = refreshToken;
		event.locals.decodedToken = decodedToken;
		return resolve(event);
	}

	/** if the token is invalid and the reason is not that the token is expired, throw an error */
	if (err.code !== 'ERR_JWT_EXPIRED') {
		deleteToken({ cookies });
		error(401, err.message);
	}

	/** the below code is executed if the token is expired */

	/** if refreshToken is missing, throw an error */
	if (!is.String(refreshToken)) {
		deleteToken({ cookies });
		error(401, 'Invalid token and Refresh token is missing');
	}

	/** get new token */
	const newToken = await refreshAndGetToken(refreshToken);

	/** if new token is missing, throw an error */
	if (!is.String(newToken)) {
		deleteToken({ cookies });
		error(401, 'Invalid token and cannot get new token');
	}

	/** decode the new token */
	const [err1, newDecodedToken] = await to(decodeToken(newToken));

	/** if the new token is invalid, throw an error */
	if (err1) {
		deleteToken({ cookies });
		error(401, 'Invalid token and Refresh token is invalid');
	}

	event.locals.token = ensure(token ?? newToken, is.String);
	event.locals.refreshToken = ensure(refreshToken, is.String);
	event.locals.decodedToken = newDecodedToken;

	/** set the new token in the cookie */
	setToken({
		cookies,
		token: event.locals.token,
		refreshToken: event.locals.refreshToken
	});

	return resolve(event);
}) satisfies Handle;
