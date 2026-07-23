const GREY = '\x1b[90m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

export class Logger {
  private readonly startTime = Date.now();

  info(message: string): void {
    this.write('INFO', message, CYAN);
  }

  success(message: string): void {
    this.write(' OK ', message, GREEN);
  }

  warn(message: string): void {
    this.write('WARN', message, YELLOW);
  }

  error(message: string): void {
    this.write('FAIL', message, RED);
  }

  state(from: string, to: string): void {
    this.write('>>>>',  `${from} → ${BOLD}${to}${RESET}`, GREY);
  }

  timing(label: string, durationMs: number): void {
    const sec = (durationMs / 1000).toFixed(1);
    this.info(`${label} ${GREY}(${sec}s)${RESET}`);
  }

  separator(): void {
    console.error(`${GREY}${'─'.repeat(80)}${RESET}`);
  }

  private write(level: string, message: string, color: string): void {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1).padStart(7);
    console.error(`${GREY}[${elapsed}s]${RESET} ${color}[${level}]${RESET} ${message}`);
  }
}
