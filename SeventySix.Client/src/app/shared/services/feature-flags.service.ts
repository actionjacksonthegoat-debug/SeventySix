/**
 * Feature flags service.
 * Fetches feature flags from the API on application startup and exposes them as signals.
 *
 * Safe defaults on error: MFA enabled, TOTP and OAuth disabled.
 * This ensures optional features don't appear broken if the flags endpoint is briefly unavailable.
 */

import { HttpClient } from "@angular/common/http";
import {
	inject,
	Injectable,
	Signal,
	signal,
	WritableSignal
} from "@angular/core";
import { environment } from "@environments/environment";
import { FeatureFlags } from "@shared/models/feature-flags.model";
import { catchError, firstValueFrom, of } from "rxjs";

/** Safe defaults to use when the feature flags endpoint is unavailable. */
const DEFAULT_FLAGS: FeatureFlags =
	{
		mfaEnabled: true,
		totpEnabled: false,
		oAuthEnabled: false,
		oAuthProviders: [],
		altchaEnabled: true,
		tokenRefreshBufferSeconds: 60
	};

/**
 * Singleton service that loads feature flags once at app startup and exposes them as readonly signals.
 * Use the `initializeFeatureFlags` factory function in `app.config.ts` as an `APP_INITIALIZER`.
 */
@Injectable(
	{
		providedIn: "root"
	})
export class FeatureFlagsService
{
	private readonly httpClient: HttpClient =
		inject(HttpClient);

	private readonly _mfaEnabled: WritableSignal<boolean> =
		signal(DEFAULT_FLAGS.mfaEnabled);

	private readonly _totpEnabled: WritableSignal<boolean> =
		signal(DEFAULT_FLAGS.totpEnabled);

	private readonly _oAuthEnabled: WritableSignal<boolean> =
		signal(DEFAULT_FLAGS.oAuthEnabled);

	private readonly _oAuthProviders: WritableSignal<string[]> =
		signal(DEFAULT_FLAGS.oAuthProviders);

	private readonly _altchaEnabled: WritableSignal<boolean> =
		signal(DEFAULT_FLAGS.altchaEnabled);

	private readonly _tokenRefreshBufferSeconds: WritableSignal<number> =
		signal(
			DEFAULT_FLAGS.tokenRefreshBufferSeconds);

	/** Whether email/code-based MFA is enabled on the server. */
	readonly mfaEnabled: Signal<boolean> =
		this._mfaEnabled.asReadonly();

	/** Whether TOTP (authenticator app) MFA is enabled on the server. */
	readonly totpEnabled: Signal<boolean> =
		this._totpEnabled.asReadonly();

	/** Whether OAuth social login is enabled on the server. */
	readonly oAuthEnabled: Signal<boolean> =
		this._oAuthEnabled.asReadonly();

	/** Names of configured OAuth providers (empty when OAuth is disabled). */
	readonly oAuthProviders: Signal<string[]> =
		this._oAuthProviders.asReadonly();

	/** Whether ALTCHA proof-of-work bot protection is enabled on the server. */
	readonly altchaEnabled: Signal<boolean> =
		this._altchaEnabled.asReadonly();

	/**
	 * Seconds before access token expiry at which the client should proactively refresh.
	 * Sourced from server-side JwtSettings — defaults to 60 until flags are loaded.
	 */
	readonly tokenRefreshBufferSeconds: Signal<number> =
		this._tokenRefreshBufferSeconds.asReadonly();

	/**
	 * Loads feature flags from the API. Called once on app startup.
	 * On network or API error, safe defaults are used and the app continues normally.
	 * @returns {Promise<void>} Resolves when flags are loaded (or defaults applied).
	 */
	async initialize(): Promise<void>
	{
		const flags: FeatureFlags =
			await firstValueFrom(
				this
					.httpClient
					.get<FeatureFlags>(`${environment.apiUrl}/config/features`)
					.pipe(
						catchError(() => of(DEFAULT_FLAGS))));

		this._mfaEnabled.set(flags.mfaEnabled);
		this._totpEnabled.set(flags.totpEnabled);
		this._oAuthEnabled.set(flags.oAuthEnabled);
		this._oAuthProviders.set(flags.oAuthProviders ?? []);
		this._altchaEnabled.set(flags.altchaEnabled ?? DEFAULT_FLAGS.altchaEnabled);
		this._tokenRefreshBufferSeconds.set(
			flags.tokenRefreshBufferSeconds ?? DEFAULT_FLAGS.tokenRefreshBufferSeconds);
	}
}
