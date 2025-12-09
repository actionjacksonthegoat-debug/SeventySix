// <copyright file="CreateClientLogCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Command to create a single client-side log entry.
/// </summary>
/// <param name="Request">The log creation request containing log details.</param>
public record CreateClientLogCommand(CreateLogRequest Request);
