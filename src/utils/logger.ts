const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";

function timestamp(): string {
  return new Date().toISOString();
}

function format(scope: string, message: string, color: string): string {
  return `${DIM}[${timestamp()}]${RESET} ${color}${scope}${RESET} ${message}`;
}

export const logger = {
  info(message: string, ...args: unknown[]): void {
    console.log(format("INFO", message, GREEN), ...args);
  },
  warn(message: string, ...args: unknown[]): void {
    console.warn(format("WARN", message, YELLOW), ...args);
  },
  error(message: string, ...args: unknown[]): void {
    console.error(format("ERROR", message, RED), ...args);
  },
};
