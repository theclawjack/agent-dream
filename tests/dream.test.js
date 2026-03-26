const os = require('os');
const fs = require('fs/promises');
const path = require('path');
const { readState, writeState } = require('../src/state');
const { orient } = require('../src/orient');
const { gather } = require('../src/gather');
const { consolidate } = require('../src/consolidate');
const { prune } = require('../src/prune');
const { dream } = require('../src/index');

function tmpDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'agent-dream-test-'));
}

describe('state', () => {
  test('readState returns defaults when file missing', async () => {
    const dir = await tmpDir();
    const state = await readState(path.join(dir, 'missing.json'));
    expect(state).toEqual({ lastDream: null, dailyFilesProcessed: [], version: 1 });
  });

  test('readState parses existing file', async () => {
    const dir = await tmpDir();
    const file = path.join(dir, 'state.json');
    const data = { lastDream: '2026-01-01', dailyFilesProcessed: ['a.md'], version: 1 };
    await fs.writeFile(file, JSON.stringify(data));
    const state = await readState(file);
    expect(state).toEqual(data);
  });

  test('writeState writes pretty JSON', async () => {
    const dir = await tmpDir();
    const file = path.join(dir, 'state.json');
    const data = { lastDream: null, dailyFilesProcessed: [], version: 1 };
    await writeState(file, data);
    const raw = await fs.readFile(file, 'utf8');
    expect(raw).toBe(JSON.stringify(data, null, 2) + '\n');
  });
});

describe('orient', () => {
  test('scans logs and filters processed files', async () => {
    const dir = await tmpDir();
    const logsDir = path.join(dir, 'logs');
    await fs.mkdir(logsDir);
    await fs.writeFile(path.join(logsDir, '2026-01-01.md'), 'day 1');
    await fs.writeFile(path.join(logsDir, '2026-01-02.md'), 'day 2');
    await fs.writeFile(path.join(logsDir, 'notes.txt'), 'ignore me');

    const stateFile = path.join(dir, 'state.json');
    await fs.writeFile(stateFile, JSON.stringify({
      lastDream: '2026-01-01',
      dailyFilesProcessed: ['2026-01-01.md'],
      version: 1,
    }));

    const memoryFile = path.join(dir, 'memory.md');
    await fs.writeFile(memoryFile, 'existing memory');

    const result = await orient({ memoryFile, logsDir, stateFile });
    expect(result.longTermMemory).toBe('existing memory');
    expect(result.allLogFiles).toEqual(['2026-01-01.md', '2026-01-02.md']);
    expect(result.unprocessedFiles).toEqual(['2026-01-02.md']);
  });

  test('handles missing memory file', async () => {
    const dir = await tmpDir();
    const logsDir = path.join(dir, 'logs');
    await fs.mkdir(logsDir);
    const result = await orient({
      memoryFile: path.join(dir, 'missing.md'),
      logsDir,
      stateFile: path.join(dir, 'missing-state.json'),
    });
    expect(result.longTermMemory).toBe('');
    expect(result.allLogFiles).toEqual([]);
  });
});

describe('gather', () => {
  test('reads unprocessed files', async () => {
    const dir = await tmpDir();
    const logsDir = path.join(dir, 'logs');
    await fs.mkdir(logsDir);
    await fs.writeFile(path.join(logsDir, '2026-01-02.md'), 'day 2 content');

    const result = await gather({ logsDir, unprocessedFiles: ['2026-01-02.md'] });
    expect(result).toEqual([
      { filename: '2026-01-02.md', date: '2026-01-02', content: 'day 2 content' },
    ]);
  });

  test('returns empty array when nothing to process', async () => {
    const result = await gather({ logsDir: '/tmp', unprocessedFiles: [] });
    expect(result).toEqual([]);
  });
});

describe('consolidate', () => {
  test('throws if consolidateFn not a function', async () => {
    await expect(
      consolidate({ longTermMemory: '', newLogs: [], consolidateFn: 'not a fn' })
    ).rejects.toThrow('consolidateFn must be a function');
  });

  test('returns memory unchanged when no new logs', async () => {
    const result = await consolidate({
      longTermMemory: 'old memory',
      newLogs: [],
      consolidateFn: () => 'should not be called',
    });
    expect(result).toBe('old memory');
  });

  test('calls consolidateFn with memory and logs', async () => {
    const fn = jest.fn().mockResolvedValue('merged memory');
    const logs = [{ filename: 'a.md', date: '2026-01-01', content: 'hi' }];
    const result = await consolidate({
      longTermMemory: 'old',
      newLogs: logs,
      consolidateFn: fn,
    });
    expect(fn).toHaveBeenCalledWith('old', logs);
    expect(result).toBe('merged memory');
  });
});

describe('prune', () => {
  test('writes memory and updates state', async () => {
    const dir = await tmpDir();
    const memoryFile = path.join(dir, 'sub', 'memory.md');
    const stateFile = path.join(dir, 'state.json');
    const state = { lastDream: null, dailyFilesProcessed: ['old.md'], version: 1 };

    const newState = await prune({
      memoryFile,
      stateFile,
      updatedMemory: 'new memory content',
      state,
      processedFiles: ['2026-01-02.md'],
    });

    const memContent = await fs.readFile(memoryFile, 'utf8');
    expect(memContent).toBe('new memory content');
    expect(newState.dailyFilesProcessed).toEqual(['old.md', '2026-01-02.md']);
    expect(newState.lastDream).toBeTruthy();
  });
});

describe('dream (integration)', () => {
  test('full cycle with stub consolidator', async () => {
    const dir = await tmpDir();
    const logsDir = path.join(dir, 'logs');
    await fs.mkdir(logsDir);
    await fs.writeFile(path.join(logsDir, '2026-03-25.md'), '# March 25\nDid stuff.');
    await fs.writeFile(path.join(logsDir, '2026-03-26.md'), '# March 26\nDid more stuff.');

    const memoryFile = path.join(dir, 'memory.md');
    const stateFile = path.join(dir, 'state.json');

    const phases = [];
    const result = await dream({
      memoryFile,
      logsDir,
      stateFile,
      consolidate: async (memory, logs) => {
        return memory + '\n\n' + logs.map((l) => `## ${l.date}\n${l.content}`).join('\n\n');
      },
      onPhase: (evt) => phases.push(evt),
    });

    expect(result.processed).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.newMemory).toContain('March 25');
    expect(result.newMemory).toContain('March 26');
    expect(result.state.dailyFilesProcessed).toContain('2026-03-25.md');
    expect(result.state.dailyFilesProcessed).toContain('2026-03-26.md');
    expect(phases.length).toBeGreaterThanOrEqual(8); // 4 phases x start+done
  });

  test('second run skips already-processed files', async () => {
    const dir = await tmpDir();
    const logsDir = path.join(dir, 'logs');
    await fs.mkdir(logsDir);
    await fs.writeFile(path.join(logsDir, '2026-03-25.md'), 'day 1');

    const memoryFile = path.join(dir, 'memory.md');
    const stateFile = path.join(dir, 'state.json');
    const stub = async (mem, logs) => mem + logs.map((l) => l.content).join('');

    await dream({ memoryFile, logsDir, stateFile, consolidate: stub });
    const result2 = await dream({ memoryFile, logsDir, stateFile, consolidate: stub });

    expect(result2.processed).toBe(0);
    expect(result2.skipped).toBe(1);
  });

  test('throws on missing config', async () => {
    await expect(dream({})).rejects.toThrow('config.memoryFile is required');
    await expect(dream({ memoryFile: 'x' })).rejects.toThrow('config.logsDir is required');
  });
});
