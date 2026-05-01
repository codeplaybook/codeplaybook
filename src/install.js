'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Write files to the project directory.
 * Each file is { path: 'relative/path', content: 'string' }.
 * Returns the count of files written.
 */
function installForAgent(projectPath, files) {
  let count = 0;

  for (const file of files) {
    const fullPath = path.join(projectPath, file.path);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, file.content, 'utf-8');
    count++;
  }

  return count;
}

module.exports = { installForAgent };
