// <copyright file="MediaTypeConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Constants;

/// <summary>
/// Constants for HTTP media type (Content-Type) strings.
/// </summary>
public static class MediaTypeConstants
{
	/// <summary>JSON content type.</summary>
	public const string Json = "application/json";

	/// <summary>XML content type.</summary>
	public const string Xml = "application/xml";

	/// <summary>Form URL encoded content type.</summary>
	public const string FormUrlEncoded = "application/x-www-form-urlencoded";

	/// <summary>Multipart form data content type.</summary>
	public const string MultipartFormData = "multipart/form-data";
}