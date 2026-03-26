async function consolidate({ longTermMemory, newLogs, consolidateFn }) {
  if (typeof consolidateFn !== 'function') {
    throw new TypeError('consolidateFn must be a function');
  }

  if (!newLogs || newLogs.length === 0) {
    return longTermMemory;
  }

  const result = await consolidateFn(longTermMemory, newLogs);
  if (typeof result !== 'string') {
    throw new TypeError(`consolidateFn must return a string, got ${typeof result}`);
  }
  return result;
}

module.exports = { consolidate };
