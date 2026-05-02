'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS audit_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_name TEXT NOT NULL,
  project_path TEXT NOT NULL,
  run_date TEXT NOT NULL,
  total_violations INTEGER NOT NULL,
  standards_checked INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id INTEGER NOT NULL REFERENCES audit_runs(id),
  fingerprint TEXT NOT NULL,
  file TEXT NOT NULL,
  line INTEGER,
  end_line INTEGER,
  standard_name TEXT NOT NULL,
  standard_slug TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Medium',
  rule TEXT NOT NULL,
  evidence TEXT NOT NULL,
  suggested_fix TEXT,
  context_snippet TEXT,
  status TEXT NOT NULL DEFAULT 'open'
);

CREATE INDEX IF NOT EXISTS idx_violations_fingerprint ON violations(fingerprint);
CREATE INDEX IF NOT EXISTS idx_violations_run_id ON violations(run_id);
CREATE INDEX IF NOT EXISTS idx_audit_runs_project ON audit_runs(project_name);
`;

/**
 * Get the user-level DB path: ~/.codeplaybook/audit.db
 */
function getDbPath() {
  const dir = path.join(os.homedir(), '.codeplaybook');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'audit.db');
}

/**
 * Generate a fingerprint for a violation.
 * Used to track violations across runs (detect new, fixed, recurring).
 */
function fingerprint(standardSlug, rule, file) {
  const input = `${standardSlug}|${rule}|${file}`;
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

/**
 * Initialize the SQLite database. Creates tables if they don't exist.
 * Returns the db instance.
 */
function initDb(dbPath) {
  const Database = require('better-sqlite3');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}

/**
 * Save an audit run with its violations.
 * Auto-marks previously-open violations as 'fixed' if their fingerprint
 * is absent in the new run (scoped to the same project).
 */
function saveAuditRun(db, data, projectName, projectPath) {
  const runDate = new Date().toISOString();

  const insertRun = db.prepare(`
    INSERT INTO audit_runs (project_name, project_path, run_date, total_violations, standards_checked)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertViolation = db.prepare(`
    INSERT INTO violations (run_id, fingerprint, file, line, end_line, standard_name, standard_slug, severity, rule, evidence, suggested_fix, context_snippet, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `);

  const transaction = db.transaction(() => {
    // Insert the run
    const result = insertRun.run(
      projectName,
      projectPath,
      runDate,
      data.violations.length,
      data.standards_checked || 0
    );
    const runId = result.lastInsertRowid;

    // Collect fingerprints from this run
    const currentFingerprints = new Set();

    // Insert violations
    for (const v of data.violations) {
      const fp = fingerprint(v.standard_slug, v.rule, v.file);
      currentFingerprints.add(fp);

      const contextJson = v.context ? JSON.stringify(v.context) : null;

      insertViolation.run(
        runId,
        fp,
        v.file,
        v.line || null,
        v.end_line || v.line || null,
        v.standard_name,
        v.standard_slug,
        v.severity || 'Medium',
        v.rule,
        v.evidence,
        v.suggested_fix || null,
        contextJson
      );
    }

    // Mark previously-open violations as 'fixed' if their fingerprint
    // is not present in this run (scoped to same project)
    const previousRunIds = db.prepare(`
      SELECT id FROM audit_runs WHERE project_name = ? AND id != ?
    `).all(projectName, runId).map(r => r.id);

    if (previousRunIds.length > 0) {
      const placeholders = previousRunIds.map(() => '?').join(',');
      const previousOpen = db.prepare(`
        SELECT DISTINCT fingerprint FROM violations
        WHERE status = 'open' AND run_id IN (${placeholders})
      `).all(...previousRunIds);

      const markFixed = db.prepare(`
        UPDATE violations SET status = 'fixed'
        WHERE fingerprint = ? AND status = 'open' AND run_id IN (${placeholders})
      `);

      for (const row of previousOpen) {
        if (!currentFingerprints.has(row.fingerprint)) {
          markFixed.run(row.fingerprint, ...previousRunIds);
        }
      }
    }

    return { runId, runDate };
  });

  return transaction();
}

/**
 * Get distinct projects.
 */
function getProjects(db) {
  return db.prepare(`
    SELECT project_name, project_path, MAX(run_date) as last_run,
           COUNT(*) as total_runs
    FROM audit_runs
    GROUP BY project_name
    ORDER BY last_run DESC
  `).all();
}

/**
 * Get audit runs, optionally filtered by project. Most recent first.
 */
function getAuditRuns(db, projectName) {
  if (projectName) {
    return db.prepare(`
      SELECT * FROM audit_runs WHERE project_name = ? ORDER BY run_date DESC
    `).all(projectName);
  }
  return db.prepare(`
    SELECT * FROM audit_runs ORDER BY run_date DESC
  `).all();
}

/**
 * Get the most recent audit run with its violations.
 */
function getLatestRun(db, projectName) {
  let run;
  if (projectName) {
    run = db.prepare(`
      SELECT * FROM audit_runs WHERE project_name = ? ORDER BY run_date DESC LIMIT 1
    `).get(projectName);
  } else {
    run = db.prepare(`
      SELECT * FROM audit_runs ORDER BY run_date DESC LIMIT 1
    `).get();
  }

  if (!run) return null;

  const violations = db.prepare(`
    SELECT * FROM violations WHERE run_id = ? ORDER BY
      CASE severity
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
      END,
      file, line
  `).all(run.id);

  return { ...run, violations };
}

/**
 * Get violations with optional filters.
 */
function getViolations(db, filters = {}) {
  let sql = 'SELECT v.* FROM violations v';
  const params = [];
  const joins = [];
  const conditions = ['1=1'];

  if (filters.project) {
    joins.push('JOIN audit_runs ar ON v.run_id = ar.id');
    conditions.push('ar.project_name = ?');
    params.push(filters.project);
  }

  if (filters.runId) {
    conditions.push('v.run_id = ?');
    params.push(filters.runId);
  }
  if (filters.severity) {
    conditions.push('v.severity = ?');
    params.push(filters.severity);
  }
  if (filters.standard) {
    conditions.push('v.standard_slug = ?');
    params.push(filters.standard);
  }
  if (filters.status) {
    conditions.push('v.status = ?');
    params.push(filters.status);
  }

  sql += (joins.length ? ' ' + joins.join(' ') : '') +
    ' WHERE ' + conditions.join(' AND ') +
    ` ORDER BY
      CASE v.severity
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
      END,
      v.file, v.line`;

  return db.prepare(sql).all(...params);
}

/**
 * Get violation trends across the last N runs, optionally filtered by project.
 */
function getTrends(db, limit = 10, projectName) {
  let runsSql = 'SELECT id, run_date, total_violations FROM audit_runs';
  const runsParams = [];

  if (projectName) {
    runsSql += ' WHERE project_name = ?';
    runsParams.push(projectName);
  }

  runsSql += ' ORDER BY run_date DESC LIMIT ?';
  runsParams.push(limit);

  const runs = db.prepare(runsSql).all(...runsParams);

  const trends = [];
  for (const run of runs.reverse()) {
    const counts = db.prepare(`
      SELECT severity, COUNT(*) as count FROM violations
      WHERE run_id = ?
      GROUP BY severity
    `).all(run.id);

    const bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const c of counts) {
      bySeverity[c.severity] = c.count;
    }

    trends.push({
      run_id: run.id,
      run_date: run.run_date,
      total: run.total_violations,
      ...bySeverity
    });
  }

  return trends;
}

/**
 * Update a violation's status.
 */
function updateViolationStatus(db, violationId, status) {
  return db.prepare(`
    UPDATE violations SET status = ? WHERE id = ?
  `).run(status, violationId);
}

module.exports = {
  getDbPath,
  initDb,
  saveAuditRun,
  getProjects,
  getAuditRuns,
  getLatestRun,
  getViolations,
  getTrends,
  updateViolationStatus
};
