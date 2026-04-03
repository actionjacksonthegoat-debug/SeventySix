/**
 * Re-exports consent utilities from the shared commerce package.
 * @see {@link @seventysixcommerce/shared/analytics}
 */
export {
	CONSENT_COOKIE_MAX_AGE,
	CONSENT_COOKIE_NAME,
	getConsentState,
	revokeConsent,
	setConsentState
} from "@seventysixcommerce/shared/analytics";
export type { ConsentState } from "@seventysixcommerce/shared/analytics";