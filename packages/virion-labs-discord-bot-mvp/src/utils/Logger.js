class Logger {
  constructor(isDebug = false) {
    this.isDebug = isDebug;
  }

  info(message, ...args) {
    console.log(`[INFO] ${message}`, ...args);
  }

  success(message, ...args) {
    console.log(`[SUCCESS] ${message}`, ...args);
  }

  warn(message, ...args) {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  debug(message, ...args) {
    if (this.isDebug) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}

module.exports = { Logger };