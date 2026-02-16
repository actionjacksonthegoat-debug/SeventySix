// <copyright file="DeleteLogsOlderThanCommand.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Command to delete log entries older than a specified date.
/// </summary>
/// <param name="CutoffDate">
/// The cutoff date - logs older than this will be deleted.
/// </param>
public record DeleteLogsOlderThanCommand(DateTimeOffset CutoffDate);