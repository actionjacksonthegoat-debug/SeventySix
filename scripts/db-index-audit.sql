-- =============================================================================
-- Database Index Audit Script
-- Run against a populated SeventySix database to identify indexing gaps.
-- Requires pg_stat_user_tables and pg_stat_user_indexes (reset with pg_stat_reset()).
-- =============================================================================

-- ─────────────────────────────────────────────
-- 1. Tables with high sequential scan ratios
--    (candidates for missing indexes)
-- ─────────────────────────────────────────────
SELECT
    schemaname,
    relname AS table_name,
    seq_scan,
    idx_scan,
    n_live_tup AS estimated_rows,
    CASE
        WHEN (seq_scan + idx_scan) > 0
        THEN ROUND(100.0 * seq_scan / (seq_scan + idx_scan), 1)
        ELSE 0
    END AS seq_scan_pct
FROM pg_stat_user_tables
WHERE n_live_tup > 100
ORDER BY seq_scan_pct DESC, seq_scan DESC;

-- ─────────────────────────────────────────────
-- 2. Indexes with zero scans (deletion candidates)
--    Excludes primary keys and unique constraints.
-- ─────────────────────────────────────────────
SELECT
    s.schemaname,
    s.relname AS table_name,
    s.indexrelname AS index_name,
    s.idx_scan,
    pg_relation_size(s.indexrelid) AS index_size_bytes,
    pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size
FROM pg_stat_user_indexes s
JOIN pg_index i ON s.indexrelid = i.indexrelid
WHERE s.idx_scan = 0
  AND NOT i.indisprimary
  AND NOT i.indisunique
ORDER BY pg_relation_size(s.indexrelid) DESC;

-- ─────────────────────────────────────────────
-- 3. Foreign keys without supporting indexes
-- ─────────────────────────────────────────────
SELECT
    c.conrelid::regclass AS table_name,
    c.conname AS fk_name,
    a.attname AS fk_column,
    c.confrelid::regclass AS referenced_table
FROM pg_constraint c
JOIN pg_attribute a
    ON a.attrelid = c.conrelid
    AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
      SELECT 1
      FROM pg_index i
      WHERE i.indrelid = c.conrelid
        AND a.attnum = ANY(i.indkey)
  )
ORDER BY table_name, fk_column;

-- ─────────────────────────────────────────────
-- 4. Table bloat estimate (dead tuples)
--    High dead tuple counts suggest vacuum tuning.
-- ─────────────────────────────────────────────
SELECT
    schemaname,
    relname AS table_name,
    n_live_tup,
    n_dead_tup,
    CASE
        WHEN n_live_tup > 0
        THEN ROUND(100.0 * n_dead_tup / n_live_tup, 1)
        ELSE 0
    END AS dead_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 100
ORDER BY n_dead_tup DESC;

-- ─────────────────────────────────────────────
-- 5. Current index listing (all user indexes)
-- ─────────────────────────────────────────────
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname IN ('Identity', 'security', 'Logging', 'ApiTracking', 'ElectronicNotifications', 'public')
ORDER BY schemaname, tablename, indexname;
