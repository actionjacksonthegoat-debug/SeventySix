// <copyright file="DeleteLogCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Command to delete a single log entry by ID.
/// </summary>
/// <param name="LogId">The ID of the log entry to delete.</param>
public record DeleteLogCommand(int LogId);