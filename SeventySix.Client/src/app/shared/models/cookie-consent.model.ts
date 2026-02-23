export interface CookieConsentPreferences
{
	strictlyNecessary: true; // Always true — cannot be disabled
	functional: boolean;
	analytics: boolean;
	consentDate: string; // ISO 8601 date string
	version: string; // Consent version — bump when policy changes to re-prompt users
}