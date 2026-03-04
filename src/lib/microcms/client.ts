import { createClient } from 'microcms-js-sdk';
import { env } from '@/lib/env';

export const cmsClient = createClient({
  serviceDomain: env.MICROCMS_SERVICE_DOMAIN,
  apiKey: env.MICROCMS_API_KEY,
});
