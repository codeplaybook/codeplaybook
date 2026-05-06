'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Load all content files from the package.
 * Returns { blueprints, analyses, workflows } with name and content for each.
 */
function assembleContent(packageRoot) {
  const blueprints = loadDir(path.join(packageRoot, 'blueprints'));
  const analyses = loadDir(path.join(packageRoot, 'analyses'));
  const workflows = loadWorkflows(path.join(packageRoot, 'workflows'));

  return { blueprints, analyses, workflows };
}

/**
 * Load all .md files from a directory.
 * Returns array of { name, filename, content }.
 */
function loadDir(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .map(f => ({
      name: f.replace('.md', ''),
      filename: f,
      content: fs.readFileSync(path.join(dirPath, f), 'utf-8')
    }));
}

/**
 * Load workflow files as a keyed object.
 * Returns { onboard, sync, audit } with content strings.
 */
function loadWorkflows(dirPath) {
  const result = {};
  const files = ['onboard.md', 'sync.md', 'audit.md'];

  for (const f of files) {
    const filePath = path.join(dirPath, f);
    if (fs.existsSync(filePath)) {
      const key = f.replace('.md', '');
      result[key] = fs.readFileSync(filePath, 'utf-8');
    }
  }

  return result;
}

module.exports = { assembleContent };
