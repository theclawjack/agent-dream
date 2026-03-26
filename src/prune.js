const fs = require('fs/promises');
const path = require('path');
const { writeState } = require('./state');

async function prune({ memoryFile, stateFile, updatedMemory, state, processedFiles }) {
  // Ensure parent directory exists
  await fs.mkdir(path.dirname(memoryFile), { recursive: true });
  await fs.writeFile(memoryFile, updatedMemory, 'utf8');

  const updatedState = {
    ...state,
    lastDream: new Date().toISOString(),
    dailyFilesProcessed: [...new Set([...state.dailyFilesProcessed, ...processedFiles])],
  };

  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  await writeState(stateFile, updatedState);

  return updatedState;
}

module.exports = { prune };
