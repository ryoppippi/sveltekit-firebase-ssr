export const load = async ({ locals }) => {
	const { decodedToken, token } = locals;
	return { decodedToken, token };
};
