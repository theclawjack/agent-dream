#!/usr/bin/env node

const path = require('path');
const { dream } = require('../src/index');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--memory' && argv[i + 1]) args.memory = argv[++i];
    else if (arg === '--logs' && argv[i + 1]) args.logs = argv[++i];
    else if (arg === '--state' && argv[i + 1]) args.state = argv[++i];
    else if (arg === '--consolidator' && argv[i + 1]) args.consolidator = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.memory || !args.logs || !args.state || !args.consolidator) {
    console.error('Usage: agent-dream --memory <file> --logs <dir> --state <file> --consolidator <module>');
    console.error('');
    console.error('Options:');
    console.error('  --memory        Path to long-term memory file');
    console.error('  --logs          Path to daily logs directory');
    console.error('  --state         Path to state file');
    console.error('  --consolidator  Path to JS module exporting a consolidate function');
    process.exit(1);
  }

  const consolidatorPath = path.resolve(args.consolidator);
  let consolidateFn;
  try {
    const mod = require(consolidatorPath);
    consolidateFn = typeof mod === 'function' ? mod : mod.consolidate || mod.default;
    if (typeof consolidateFn !== 'function') {
      throw new Error('Module must export a function (default, .consolidate, or module.exports)');
    }
  } catch (err) {
    console.error(`Failed to load consolidator from ${consolidatorPath}:`);
    console.error(err.message);
    process.exit(1);
  }

  const result = await dream({
    memoryFile: path.resolve(args.memory),
    logsDir: path.resolve(args.logs),
    stateFile: path.resolve(args.state),
    consolidate: consolidateFn,
    onPhase: ({ name, status, meta }) => {
      const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
      console.log(`[${name}] ${status}${metaStr}`);
    },
  });

  console.log(`\nDone! Processed ${result.processed} file(s), skipped ${result.skipped}.`);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
