import { main } from '@bds-utils/updater-core';

export async function serverUpdater(): Promise<void> {
  await main();
}