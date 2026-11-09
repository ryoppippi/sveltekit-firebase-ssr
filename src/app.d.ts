import '@total-typescript/ts-reset';
import type { DecodedIdToken } from '#lib/firebase/types.ts';

declare global {
	namespace App {
		interface Locals {
			token: string | undefined;
			decodedToken: DecodedIdToken | undefined;
			refreshToken: string | undefined;
		}
	}
}
