import type { DecodedIdToken } from 'firebase-admin/auth';

export type ProviderName = 'google';

export type DecodeTokenError = { code: string; message: string; status: string };
export type { DecodedIdToken };
