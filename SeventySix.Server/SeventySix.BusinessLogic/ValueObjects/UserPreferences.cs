// <copyright file="UserPreferences.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.BusinessLogic.ValueObjects;

/// <summary>
/// Value object representing user preferences and settings.
/// Encapsulates user-specific configuration options for UI and notifications.
/// </summary>
/// <remarks>
/// This value object follows Domain-Driven Design principles for value objects:
/// - Immutability: Use record type with init-only properties
/// - Value equality: Two preferences with same values are considered equal
/// - No identity: Preferences are defined by their values, not an ID
/// - Self-validation: Properties have sensible defaults
///
/// Storage:
/// - Serialized to JSON and stored in User.Preferences column (jsonb in PostgreSQL)
/// - Allows flexible schema evolution without database migrations
/// - Can be null (user has no custom preferences)
///
/// Design Principles:
/// - Encapsulation: Groups related preference data
/// - Type Safety: Strongly-typed instead of dictionary/dynamic
/// - Validation: Enum types prevent invalid values
/// - Extensibility: Easy to add new preferences
///
/// Usage Example:
/// <code>
/// var preferences = new UserPreferences
/// {
///     Theme = "dark",
///     NotificationsEnabled = true,
///     Language = "en-US"
/// };
/// user.Preferences = JsonSerializer.Serialize(preferences);
///
/// // Later, deserialize:
/// var prefs = JsonSerializer.Deserialize&lt;UserPreferences&gt;(user.Preferences);
/// </code>
/// </remarks>
public record UserPreferences
{
	/// <summary>
	/// Gets or initializes the user's preferred UI theme.
	/// </summary>
	/// <value>
	/// A string representing the theme name (e.g., "light", "dark", "auto").
	/// Defaults to "light" if not specified.
	/// </value>
	/// <remarks>
	/// Common values: "light", "dark", "auto" (follows system preference).
	/// Client application should validate this value and fall back to default if invalid.
	/// </remarks>
	public string Theme
	{
		get; init;
	} = "light";

	/// <summary>
	/// Gets or initializes a value indicating whether notifications are enabled.
	/// </summary>
	/// <value>
	/// True if notifications are enabled; otherwise, false.
	/// Defaults to true if not specified.
	/// </value>
	/// <remarks>
	/// Controls whether user receives in-app notifications, email alerts, etc.
	/// May be overridden by more granular notification settings (email, push, etc.)
	/// </remarks>
	public bool NotificationsEnabled
	{
		get; init;
	} = true;

	/// <summary>
	/// Gets or initializes the user's preferred language/locale.
	/// </summary>
	/// <value>
	/// A string representing the language code (e.g., "en-US", "es-ES", "fr-FR").
	/// Defaults to "en-US" if not specified.
	/// </value>
	/// <remarks>
	/// Should follow BCP 47 language tag format (e.g., "en-US", "pt-BR").
	/// Client application should validate this value and fall back to default if unsupported.
	/// Used for localization of UI strings and date/time formatting.
	/// </remarks>
	public string Language
	{
		get; init;
	} = "en-US";

	/// <summary>
	/// Gets or initializes a value indicating whether email notifications are enabled.
	/// </summary>
	/// <value>
	/// True if email notifications are enabled; otherwise, false.
	/// Defaults to true if not specified.
	/// </value>
	/// <remarks>
	/// Controls whether user receives email notifications for system events.
	/// Can be disabled even if NotificationsEnabled is true.
	/// </remarks>
	public bool EmailNotificationsEnabled
	{
		get; init;
	} = true;

	/// <summary>
	/// Gets or initializes the user's preferred timezone.
	/// </summary>
	/// <value>
	/// A string representing the timezone identifier (e.g., "America/New_York", "UTC").
	/// Defaults to "UTC" if not specified.
	/// </value>
	/// <remarks>
	/// Should use IANA timezone database identifiers.
	/// Used for displaying dates/times in user's local timezone.
	/// Client application should validate this value and fall back to UTC if invalid.
	/// </remarks>
	public string Timezone
	{
		get; init;
	} = "UTC";

	/// <summary>
	/// Gets or initializes the number of items to display per page in paginated lists.
	/// </summary>
	/// <value>
	/// An integer representing the page size preference.
	/// Defaults to 20 if not specified.
	/// Valid range: 10-100.
	/// </value>
	/// <remarks>
	/// Allows user to customize pagination density.
	/// Application should enforce min/max limits (e.g., 10-100).
	/// </remarks>
	public int PageSize
	{
		get; init;
	} = 20;

	/// <summary>
	/// Gets or initializes a value indicating whether compact mode is enabled for UI.
	/// </summary>
	/// <value>
	/// True if compact mode is enabled; otherwise, false.
	/// Defaults to false (normal spacing).
	/// </value>
	/// <remarks>
	/// Controls UI density (spacing, padding, font sizes).
	/// Useful for users who want more content visible on screen.
	/// </remarks>
	public bool CompactMode
	{
		get; init;
	}
}
