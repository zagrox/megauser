import { createDirectus, rest, authentication } from '@directus/sdk';
import { DIRECTUS_URL } from './config';

// Create a client with REST and Authentication modules
const directus = createDirectus(DIRECTUS_URL)
    .with(rest())
    .with(authentication());

export default directus;