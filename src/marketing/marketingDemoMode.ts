import { env } from '../config/env';

/**
 * Marketing Demo Mode is a display-only switch for local and staging builds.
 * Production customers never receive illustrative summary figures.
 * There is no in-app toggle that an owner can turn on in production.
 */
const MARKETING_DEMO_REQUESTED = true;

export function isMarketingDemoModeEnabled(): boolean {
  return MARKETING_DEMO_REQUESTED && env.environment !== 'production';
}
