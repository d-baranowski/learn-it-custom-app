const isDebuggingEnabled = process.env.DEBUG === 'true';

function debugLog(...args: any[]) {
  if (isDebuggingEnabled) {
    console.log(...args);
  }
}

export default debugLog;