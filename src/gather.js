const fs = require('fs/promises');
const path = require('path');

async function gather({ logsDir, unprocessedFiles }) {
  if (!unprocessedFiles || unprocessedFiles.length === 0) {
    return [];
  }

  const SAFE_FILENAME_RE = /^[\w.-]+$/;
  for (const filename of unprocessedFiles) {
    if (!SAFE_FILENAME_RE.test(filename)) {
      throw new Error(`gather: unsafe filename rejected: ${filename}`);
    }
  }

  const results = [];
  for (const filename of unprocessedFiles) {
    let content;
    try {
      content = await fs.readFile(path.join(logsDir, filename), 'utf8');
    } catch (err) {
      throw new Error(`gather: failed to read ${filename}: ${err.message}`);
    }
    const date = filename.replace(/\.md$/, '');
    results.push({ filename, date, content });
  }

  return results;
}

module.exports = { gather };
