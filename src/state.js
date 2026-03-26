const fs = require('fs/promises');

const DEFAULT_STATE = {
  lastDream: null,
  dailyFilesProcessed: [],
  version: 1,
};

async function readState(stateFile) {
  try {
    const raw = await fs.readFile(stateFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT' || err instanceof SyntaxError) {
      return { ...DEFAULT_STATE };
    }
    throw err;
  }
}

async function writeState(stateFile, state) {
  await fs.writeFile(stateFile, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

module.exports = { readState, writeState, DEFAULT_STATE };
