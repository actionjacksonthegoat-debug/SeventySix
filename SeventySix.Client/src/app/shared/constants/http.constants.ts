// <copyright file="http.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * HTTP header and media type constants.
 */

/** Content-Type header name. */
export const HTTP_HEADER_CONTENT_TYPE: string = "Content-Type";

/** Authorization header name. */
export const HTTP_HEADER_AUTHORIZATION: string = "Authorization";

/** Bearer token prefix. */
export const HTTP_BEARER_PREFIX: string = "Bearer ";

/** JSON media type. */
export const MEDIA_TYPE_JSON: string = "application/json";

/** Static asset URL prefix (e.g. self-hosted icons). */
export const HTTP_STATIC_ASSET_PREFIX: string = "/icons/";

/** HTTP protocol prefix for absolute URL detection. */
export const HTTP_PROTOCOL_PREFIX: string = "http";

/** Auth path segment for protected route detection. */
export const AUTH_PATH_SEGMENT: string = "/auth/";

/** Cache-Control header name. */
export const HTTP_HEADER_CACHE_CONTROL: string = "Cache-Control";

/** Pragma header name. */
export const HTTP_HEADER_PRAGMA: string = "Pragma";

/** Cache-Control value for full cache bypass. */
export const HTTP_CACHE_NO_STORE: string = "no-cache, no-store, must-revalidate";

/** Pragma value for cache bypass. */
export const HTTP_CACHE_NO_CACHE: string = "no-cache";