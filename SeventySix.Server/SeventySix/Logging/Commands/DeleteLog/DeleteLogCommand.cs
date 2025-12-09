// <copyright file="DeleteLogCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Command to delete a single log entry by ID.
/// </summary>
/// <param name="Id">The unique identifier of the log entry to delete.</param>
public record DeleteLogCommand(int Id);