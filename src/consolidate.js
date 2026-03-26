async function consolidate({ longTermMemory, newLogs, consolidateFn }) {
  if (typeof consolidateFn !== 'function') {
    throw new TypeError('consolidateFn must be a function');
  }

  if (!newLogs || newLogs.length === 0) {
    return longTermMemory;
  }

  return await consolidateFn(longTermMemory, newLogs);
}

module.exports = { consolidate };
