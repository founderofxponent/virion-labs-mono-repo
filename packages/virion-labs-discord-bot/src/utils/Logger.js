class Logger {
  constructor(debug = false) {
    this.debugEnabled = debug;
  }

  info(message, ...args) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  }

  error(message, ...args) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  }

  warn(message, ...args) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }

  debug(message, ...args) {
    if (this.debugEnabled) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }

  success(message, ...args) {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`, ...args);
  }
}

module.exports = { Logger }; 