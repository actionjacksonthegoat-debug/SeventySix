// <copyright file="DatabaseMaintenanceJob.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging.Jobs;

/// <summary>
/// Wolverine message that triggers PostgreSQL maintenance (VACUUM ANALYZE).
/// Runs nightly to reclaim storage and update query planner statistics.
/// </summary>
public record DatabaseMaintenanceJob;