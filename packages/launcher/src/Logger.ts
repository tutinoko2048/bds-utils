import pc from 'picocolors';
import dayjs from 'dayjs';

const c = {
  black: pc.black,
  red: pc.red,
  green: pc.green,
  yellow: pc.yellow,
  blueBright: pc.blueBright,
  blue: pc.blue,
  magenta: pc.magenta,
  cyan: pc.cyan,
  white: pc.white,
  gray: pc.gray,
} as const;

export class Logger {
  constructor(
    private readonly prefix: string,
    private readonly color: keyof typeof c = 'white'
  ) {}

  log(...message: unknown[]) {
    console.log(
      c.white(`[${this.date()} LOG]`),
      c[this.color](`[${this.prefix}]`),
      c.gray(message.map(String).join(' '))
    );
  }

  info(...message: unknown[]) {
    console.info(
      c.white(`[${this.date()} INFO]`),
      c[this.color](`[${this.prefix}]`),
      c.white(message.map(String).join(' '))
    );
  }

  error(...message: unknown[]) {
    console.error(
      c.red(`[${this.date()} ERROR]`),
      c[this.color](`[${this.prefix}]`),
      c.red(message.map(String).join(' '))
    );
  }

  warn(...message: unknown[]) {
    console.warn(
      c.yellow(`[${this.date()} WARN]`),
      c[this.color](`[${this.prefix}]`),
      c.yellow(message.map(String).join(' '))
    );
  }

  debug(...message: unknown[]) {
    console.debug(
      c.magenta(`[${this.date()} DEBUG]`),
      c[this.color](`[${this.prefix}]`),
      c.gray(message.map(String).join(' '))
    );
  }

  private date() {
    return dayjs().format('YYYY-MM-DD HH:mm:ss:SSS');
  }
}
