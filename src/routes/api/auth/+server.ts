import { deleteToken, setToken } from '$lib/firebase/server';
import { json } from '@sveltejs/kit';
import { ensure, is } from 'unknownutil';

export const POST = async ({ cookies, request }) => {
	/** get token from body */
	const resJson = await request.json();

	const { token, refreshToken } = ensure(
		resJson,
		is.ObjectOf({
			token: is.OptionalOf(is.String),
			refreshToken: is.OptionalOf(is.String)
		})
	);

	is.String(token) && is.String(refreshToken)
		? setToken({ cookies, token, refreshToken })
		: deleteToken({ cookies });

	return json({ success: true });
};
