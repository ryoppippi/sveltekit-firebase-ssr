import { dev } from '$app/env';

export const load = async ({ parent, locals }) => {
	if (dev) console.log({ locals });
	const { decodedToken } = await parent();
	return { decodedToken };
};
