const { orient } = require('./orient');
const { gather } = require('./gather');
const { consolidate } = require('./consolidate');
const { prune } = require('./prune');
const { createLogger } = require('./logger');

async function dream(config) {
  const { memoryFile, logsDir, stateFile, consolidate: consolidateFn } = config || {};

  if (!memoryFile) throw new Error('config.memoryFile is required');
  if (!logsDir) throw new Error('config.logsDir is required');
  if (!stateFile) throw new Error('config.stateFile is required');
  if (typeof consolidateFn !== 'function') {
    throw new Error('config.consolidate must be a function');
  }

  const logger = createLogger();

  // Forward logger if caller wants events
  if (typeof config.onPhase === 'function') {
    logger.on('phase', config.onPhase);
  }
  if (typeof config.onDone === 'function') {
    logger.on('done', config.onDone);
  }
  if (typeof config.onError === 'function') {
    logger.on('error', config.onError);
  }

  try {
    // Phase 1: Orient
    logger.phase('orient', 'start');
    const orientResult = await orient({ memoryFile, logsDir, stateFile });
    logger.phase('orient', 'done', {
      totalFiles: orientResult.allLogFiles.length,
      unprocessed: orientResult.unprocessedFiles.length,
    });

    // Phase 2: Gather
    logger.phase('gather', 'start');
    const newLogs = await gather({
      logsDir,
      unprocessedFiles: orientResult.unprocessedFiles,
    });
    logger.phase('gather', 'done', { count: newLogs.length });

    // Phase 3: Consolidate
    logger.phase('consolidate', 'start');
    const updatedMemory = await consolidate({
      longTermMemory: orientResult.longTermMemory,
      newLogs,
      consolidateFn,
    });
    logger.phase('consolidate', 'done');

    // Phase 4: Prune
    logger.phase('prune', 'start');
    const processedFiles = orientResult.unprocessedFiles;
    const newState = await prune({
      memoryFile,
      stateFile,
      updatedMemory,
      state: orientResult.state,
      processedFiles,
    });
    logger.phase('prune', 'done');

    const result = {
      processed: newLogs.length,
      skipped: orientResult.allLogFiles.length - orientResult.unprocessedFiles.length,
      newMemory: updatedMemory,
      state: newState,
    };

    logger.done(result);
    return result;
  } catch (err) {
    logger.error(err);
    throw err;
  }
}

module.exports = { dream, orient, gather, consolidate, prune, createLogger };
