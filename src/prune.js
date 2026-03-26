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
    dailyFilesProcessed: [
      ...state.dailyFilesProcessed,
      ...processedFiles,
    ],
  };

  await writeState(stateFile, updatedState);

  return updatedState;
}

module.exports = { prune };
