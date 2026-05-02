'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { initDb, getProjects, getAuditRuns, getLatestRun, getViolations, getTrends, updateViolationStatus } = require('./db');

function startDashboard(dbPath, port) {
  const db = initDb(dbPath);
  const dashboardDir = path.join(__dirname, '..', 'dashboard');

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${port}`);
    const project = url.searchParams.get('project') || null;

    // API routes
    if (url.pathname === '/api/projects') {
      return jsonResponse(res, getProjects(db));
    }

    if (url.pathname === '/api/runs') {
      return jsonResponse(res, getAuditRuns(db, project));
    }

    if (url.pathname === '/api/latest') {
      const latest = getLatestRun(db, project);
      if (!latest) return jsonResponse(res, { runs: [], violations: [] });
      return jsonResponse(res, latest);
    }

    if (url.pathname === '/api/violations') {
      const filters = {};
      if (project) filters.project = project;
      if (url.searchParams.get('run_id')) filters.runId = parseInt(url.searchParams.get('run_id'));
      if (url.searchParams.get('severity')) filters.severity = url.searchParams.get('severity');
      if (url.searchParams.get('standard')) filters.standard = url.searchParams.get('standard');
      if (url.searchParams.get('status')) filters.status = url.searchParams.get('status');
      return jsonResponse(res, getViolations(db, filters));
    }

    if (url.pathname === '/api/trends') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      return jsonResponse(res, getTrends(db, limit, project));
    }

    if (url.pathname.startsWith('/api/violations/') && req.method === 'POST') {
      const id = parseInt(url.pathname.split('/').pop());
      let body = '';
      req.on('data', chunk => { body += chunk; });
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
          jsonResponse(res, { ok: true });
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Serve dashboard HTML
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const htmlPath = path.join(dashboardDir, 'index.html');
      if (fs.existsSync(htmlPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(htmlPath, 'utf-8'));
      } else {
        res.writeHead(404);
        res.end('Dashboard not found');
      }
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log();
    console.log(`  codeplaybook dashboard`);
    console.log(`  ──────────────────────`);
    console.log(`  Running at ${url}`);
    console.log(`  Database: ~/.codeplaybook/audit.db`);
    console.log(`  Press Ctrl+C to stop`);
    console.log();

    // Open browser
    const { exec } = require('child_process');
    const platform = process.platform;
    if (platform === 'darwin') exec(`open ${url}`);
    else if (platform === 'linux') exec(`xdg-open ${url}`);
    else if (platform === 'win32') exec(`start ${url}`);
  });

  process.on('SIGINT', () => {
    db.close();
    process.exit(0);
  });
}

function jsonResponse(res, data) {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

module.exports = { startDashboard };
