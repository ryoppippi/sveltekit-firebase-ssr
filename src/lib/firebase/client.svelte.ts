import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import {
	GoogleAuthProvider,
	getAuth as _getAuth,
	signOut as _signOut,
	signInWithPopup
} from 'firebase/auth';
import { is } from 'unknownutil';
import type { ProviderName } from './types';

/** state of loading */
let loadingRune = $state(false);

/** get loading */
export class Loading {
	get value() {
		return loadingRune;
	}
}

/** firebase app */
export let app: FirebaseApp | undefined;

/**
 * @description get firebase provider
 */
function providerFor(name: ProviderName) {
	const provider = {
		google: new GoogleAuthProvider()
	}[name];

	provider.setCustomParameters({
		prompt: 'select_account'
	});
	return provider;
}

/** wrapper of firebase getAuth */
export function getAuth() {
	return is.Nullish(app) ? undefined : _getAuth(app);
}

/**
 * @description get token from firebase
 */
export async function getToken(): Promise<string | undefined> {
	const auth = getAuth();
	const user = auth?.currentUser;
	if (is.Nullish(user)) {
		return undefined;
	}

	const currentToken = await user.getIdToken();
	return currentToken;
}

/**
 * @description get refresh token from firebase
 */
async function getRefreshToken() {
	const auth = getAuth();
	const user = auth?.currentUser;
	if (is.Nullish(user)) {
		return undefined;
	}

	const { refreshToken } = user;
	return refreshToken;
}

/**
 * @description set token to cookie
 */
async function setToken({
	token,
	refreshToken
}: {
	token?: string | undefined;
	refreshToken?: string | undefined;
} = {}) {
	await fetch('/api/auth', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ token, refreshToken })
	});

	/** invalidate all pages and refresh */
	await invalidateAll();
}

/**
 * @description sign in with provider
 */
export async function signIn(name: ProviderName) {
	const auth = getAuth();
	if (is.Nullish(auth)) {
		throw new Error('auth is null');
	}

	const provider = providerFor(name);
	await signInWithPopup(auth, provider);
	// await signInWithRedirect(auth, provider);
}

/**
 * @description sign out
 */
export async function signOut() {
	const auth = getAuth();
	if (is.Nullish(auth)) {
		throw new Error('auth is null');
	}

	await _signOut(auth);
	await setToken();
}

/**
 *@description initialize firebase app
 *
 * @param options - firebase options
 * @param initJWTToken - initial JWT token from cookie
 *
 */
export function init(options: FirebaseOptions, initJWTToken?: string) {
	if (!browser) {
		throw new Error("Can't use the Firebase client on the server.");
	}

	/** if app is not nullish, return */
	if (!is.Nullish(app)) {
		return;
	}

	/** initialize firebase app */
	app = initializeApp(options);

	/** if auth is nullish, return */
	const auth = getAuth();
	if (is.Nullish(auth)) {
		return;
	}

	/** set loading to true */
	loadingRune = true;

	auth.onAuthStateChanged(
		async () => {
			/** set loading to false because auth state changed */
			loadingRune = false;

			/** get token from firebase */
			const token = await getToken();

			/** get refresh token from firebase */
			const refreshToken = await getRefreshToken();

			/** if token is different from cookie, set token to cookie */
			if (initJWTToken !== token) {
				/** set token to cookie */
				await setToken({ token, refreshToken });
			}
		},
		(err) => console.error(err.message)
	);
}

export type { FirebaseOptions };
