'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { initDb, getProjects, getAuditRuns, getLatestRun, getViolations, getTrends, updateViolationStatus } = require('./db');

function parseSnippet(v) {
  if (!v.context_snippet) return null;
  try {
    const ctx = JSON.parse(v.context_snippet);
    return { path: v.file, start: v.line || 1, highlight: [v.line || 1], lines: ctx.lines || [ctx] };
  } catch (e) {
    return null;
  }
}

function serveFile(res, filePath, contentType) {
  if (fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath, 'utf-8'));
    return true;
  }
  return false;
}

function startDashboard(dbPath, port) {
  const db = initDb(dbPath);
  const dashboardDir = path.join(__dirname, '..', 'dashboard');
  const json = (res, data) => jsonResponse(res, data);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const project = url.searchParams.get('project');

    // API routes
    if (url.pathname === '/api/projects') {
      return json(res, getProjects(db));
    }

    if (url.pathname === '/api/runs') {
      return json(res, getAuditRuns(db, project));
    }

    if (url.pathname === '/api/latest') {
      const latest = getLatestRun(db, project);
      if (!latest) return json(res, { runs: [], violations: [] });
      return json(res, latest);
    }

    if (url.pathname === '/api/violations') {
      const filters = {};
      if (project) filters.project = project;
      const runId = url.searchParams.get('run_id');
      if (runId) filters.runId = parseInt(runId);
      if (url.searchParams.get('severity')) filters.severity = url.searchParams.get('severity');
      if (url.searchParams.get('standard')) filters.standard = url.searchParams.get('standard');
      if (url.searchParams.get('status')) filters.status = url.searchParams.get('status');
      return json(res, getViolations(db, filters));
    }

    if (url.pathname === '/api/trends') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      return json(res, getTrends(db, limit, project));
    }

    // Combined endpoint: all projects with runs and violations for the dashboard
    if (url.pathname === '/api/dashboard') {
      const projects = getProjects(db);
      const repos = projects.map(p => {
        const runs = getAuditRuns(db, p.project_name).map(r => {
          const vCounts = db.prepare(`
            SELECT severity, COUNT(*) as count FROM violations
            WHERE run_id = ? GROUP BY severity
          `).all(r.id);
          const bySev = { critical: 0, high: 0, medium: 0, low: 0 };
          for (const c of vCounts) bySev[c.severity.toLowerCase()] = c.count;
          return {
            id: `run-${r.id}`,
            at: new Date(r.run_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            ts: r.run_date,
            trigger: 'manual',
            total: r.total_violations,
            ...bySev
          };
        });
        return { id: p.project_name, name: p.project_name, runs: runs.length ? runs : [{ id: 'empty', at: 'No runs', trigger: 'manual', total: 0, critical: 0, high: 0, medium: 0, low: 0 }] };
      });

      const violationsByRepo = {};
      for (const p of projects) {
        const latest = getLatestRun(db, p.project_name);
        if (latest && latest.violations) {
          violationsByRepo[p.project_name] = latest.violations.map((v, i) => ({
            id: v.id || i + 1,
            severity: v.severity,
            standard: v.standard_slug,
            file: v.file,
            line: v.line || 1,
            rule: v.rule,
            found: v.evidence,
            fix: v.suggested_fix || '',
            snippet: parseSnippet(v)
          }));
        } else {
          violationsByRepo[p.project_name] = [];
        }
      }

      return json(res, { repos, violationsByRepo });
    }

    if (url.pathname.startsWith('/api/violations/') && req.method === 'POST') {
      const id = parseInt(url.pathname.split('/').pop());
      if (isNaN(id)) { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid id' })); return; }
      let body = '';
      req.on('data', chunk => { body += chunk; if (body.length > 4096) { res.writeHead(413); res.end(); req.destroy(); } });
      req.on('end', () => {
        try {
          const { status } = JSON.parse(body);
          const VALID_STATUSES = ['open', 'fixed', 'ignored'];
          if (!status || !VALID_STATUSES.includes(status)) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid status. Must be: open, fixed, or ignored' }));
            return;
          }
          updateViolationStatus(db, id, status);
          json(res, { ok: true });
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Serve static files
    const safePath = path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, '');

    // Design system CSS (shared with landing page)
    if (safePath === '/design-system.css') {
      if (serveFile(res, path.join(__dirname, '..', 'landing', 'design-system.css'), 'text/css')) return;
    }

    // Dashboard HTML and assets
    if (safePath === '/' || safePath === '/index.html') {
      if (serveFile(res, path.join(dashboardDir, 'index.html'), 'text/html')) return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, '127.0.0.1', () => {
    const url = `http://localhost:${port}`;
    console.log();
    console.log(`  codeplaybook dashboard`);
    console.log(`  ──────────────────────`);
    console.log(`  Running at ${url}`);
    console.log(`  Database: ~/.codeplaybook/audit.db`);
    console.log(`  Press Ctrl+C to stop`);
    console.log();

    // Open browser
    const platform = process.platform;
    if (platform === 'darwin') execFile('open', [url]);
    else if (platform === 'linux') execFile('xdg-open', [url]);
    else if (platform === 'win32') execFile('cmd', ['/c', 'start', url]);
  });

  process.on('SIGINT', () => {
    db.close();
    process.exit(0);
  });
}

function jsonResponse(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

module.exports = { startDashboard };
