import * as cliProgress from 'cli-progress';
import * as pc from 'picocolors';

export class ProgressBar {
  private progressBar: cliProgress.SingleBar;

  constructor(label: string, total: number) {
    this.progressBar = new cliProgress.SingleBar(
      {
        format: `${pc.cyan(label)} ${pc.green('{bar}')}| {percentage}% | {value}/{total} | ETA: {eta}s`,
        barCompleteChar: '█',
        barIncompleteChar: '░',
        hideCursor: true,
        barsize: 30,
        clearOnComplete: true,
        stopOnComplete: true,
      },
      cliProgress.Presets.shades_classic
    );

    this.progressBar.start(total, 0);
  }

  update(current: number): void {
    this.progressBar.update(current);
  }

  stop(): void {
    this.progressBar.stop();
    process.stdout.write('Done.\n');
  }
}
