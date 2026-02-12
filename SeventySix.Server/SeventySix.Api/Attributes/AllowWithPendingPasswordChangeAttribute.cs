// <copyright file="AllowWithPendingPasswordChangeAttribute.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Attributes;

/// <summary>
/// Marks a controller action as accessible even when the authenticated user
/// has a pending required password change. Actions without this attribute
/// will return 403 when <c>RequiresPasswordChange</c> is <c>true</c>.
/// </summary>
[AttributeUsage(
	AttributeTargets.Method | AttributeTargets.Class,
	AllowMultiple = false)]
public sealed class AllowWithPendingPasswordChangeAttribute : Attribute;