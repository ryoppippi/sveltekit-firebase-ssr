import type { Cookies, Handle } from '@sveltejs/kit';
import { decodeToken, refreshAndGetToken } from './utils';
import type { DecodedIdToken, DecodeTokenError } from '../types';

import { is, ensure, assert } from 'unknownutil';
import { to } from 'await-to-js';

import { error } from '@sveltejs/kit';

export const TOKEN_COOKIE_NAME = 'token' as const satisfies string;
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken' as const satisfies string;

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
		event.locals.token = token;
		event.locals.decodedToken = decodedToken;
		event.locals.refreshToken = refreshToken;
		return resolve(event);
	}

	/** if the token is invalid and the reason is not that the token is expired, throw an error */
	if (err.code !== 'ERR_JWT_EXPIRED') {
		deleteToken({ cookies });
		throw error(401, err.message);
	}

	/** the below code is executed if the token is expired */

	/** if refreshToken is missing, throw an error */
	if (!is.String(refreshToken)) {
		deleteToken({ cookies });
		throw error(401, 'Invalid token and Refresh token is missing');
	}

	/** get new token */
	const newToken = await refreshAndGetToken(refreshToken);

	/** if new token is missing, throw an error */
	if (!is.String(newToken)) {
		deleteToken({ cookies });
		throw error(401, 'Invalid token and cannot get new token');
	}

	/** decode the new token */
	const [err1, newDecodedToken] = await to(decodeToken(newToken));

	/** if the new token is invalid, throw an error */
	if (err1) {
		deleteToken({ cookies });
		throw error(401, 'Invalid token and Refresh token is invalid');
	}

	event.locals.token = ensure(token ?? newToken, is.String);
	event.locals.decodedToken = newDecodedToken;
	event.locals.refreshToken = refreshToken;

	/** set the new token in the cookie */
	setToken({
		cookies,
		token: event.locals.token,
		refreshToken: event.locals.refreshToken
	});

	return resolve(event);
}) satisfies Handle;
