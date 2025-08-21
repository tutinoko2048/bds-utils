import { main } from '@bds-utils/updater-core';

export async function serverUpdater(cwd: string): Promise<void> {
  await main();
}