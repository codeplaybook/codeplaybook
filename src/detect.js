'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Detect which coding agents are present in the project.
 * Returns an array of adapters whose agent is detected.
 */
function detectAgents(projectPath, adapters) {
  return adapters.filter(adapter => adapter.detect(projectPath));
}

module.exports = { detectAgents };
