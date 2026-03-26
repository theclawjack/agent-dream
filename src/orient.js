const fs = require('fs/promises');
const path = require('path');
const { readState } = require('./state');

const DATE_FILE_RE = /^\d{4}-\d{2}-\d{2}\.md$/;

async function orient({ memoryFile, logsDir, stateFile }) {
  const state = await readState(stateFile);

  let longTermMemory = '';
  try {
    longTermMemory = await fs.readFile(memoryFile, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  let entries = [];
  try {
    entries = await fs.readdir(logsDir);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const allLogFiles = entries
    .filter((f) => DATE_FILE_RE.test(f))
    .sort();

  const processedSet = new Set(state.dailyFilesProcessed);
  const unprocessedFiles = allLogFiles.filter((f) => !processedSet.has(f));

  return { state, longTermMemory, allLogFiles, unprocessedFiles };
}

module.exports = { orient };
