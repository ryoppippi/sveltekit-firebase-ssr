import { dev } from '$app/environment';

export const load = async ({ parent, locals }) => {
	if (dev) console.log({ locals });
	const { decodedToken } = await parent();
	return { decodedToken };
};
