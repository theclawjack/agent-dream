const { EventEmitter } = require('events');

function createLogger() {
  const emitter = new EventEmitter();

  emitter.on('error', () => {}); // prevent unhandled 'error' crash

  emitter.phase = function (name, status, meta) {
    this.emit('phase', {
      name,
      status,
      meta: meta || null,
      timestamp: new Date().toISOString(),
    });
  };

  emitter.done = function (result) {
    this.emit('done', result);
  };

  emitter.error = function (err) {
    this.emit('error', err);
  };

  return emitter;
}

module.exports = { createLogger };
