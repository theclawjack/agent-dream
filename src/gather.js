const fs = require('fs/promises');
const path = require('path');

async function gather({ logsDir, unprocessedFiles }) {
  if (!unprocessedFiles || unprocessedFiles.length === 0) {
    return [];
  }

  const results = [];
  for (const filename of unprocessedFiles) {
    const content = await fs.readFile(path.join(logsDir, filename), 'utf8');
    const date = filename.replace(/\.md$/, '');
    results.push({ filename, date, content });
  }

  return results;
}

module.exports = { gather };
