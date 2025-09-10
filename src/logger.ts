import env from './env.js'
import pkg from './pkg.js'
import util from './util.js'

// Can't log to stdio as it disrupts the JSON-RPC protocol
const LOG_FILE = util.resolve('./logs.ndjson', util.REPO)

function writeLog(level: string, msg: string, data?: object): void {
  if (!env.DEBUG) {
    return
  }
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      version: pkg.version,
      cwd: util.CWD,
      message: msg,
      ...data,
    }
    util.appendNdjson(LOG_FILE, logEntry)
  } catch (err) {
    // Fallback to stderr if file writing fails
    console.error('Logger error:', err)
  }
}

const logger = {
  log: (msg: string, data?: object) => writeLog('LOG', msg, data),
  info: (msg: string, data?: object) => writeLog('INFO', msg, data),
  warn: (msg: string, data?: object) => writeLog('WARN', msg, data),
  error: (msg: string, data?: object) => writeLog('ERROR', msg, data),
}

export default logger
