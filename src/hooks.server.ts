import { firebaseHandler } from '$lib/firebase/server';
import { sequence } from '@sveltejs/kit/hooks';

export const handle = sequence(firebaseHandler);
