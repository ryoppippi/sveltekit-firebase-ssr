import { firebaseHandler } from '#lib/firebase/server.ts';
import { sequence } from '@sveltejs/kit/hooks';

export const handle = sequence(firebaseHandler);
