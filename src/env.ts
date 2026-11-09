import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_FIREBASE_PROJECT_ID: {
		public: true,
		static: true
	},
	PUBLIC_FIREBASE_API_KEY: {
		public: true,
		static: true
	}
});
