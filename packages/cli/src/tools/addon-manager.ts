import { version } from 'bun';
import { BedrockServer } from '../server';

export async function addonManager(cwd: string): Promise<void> {
  const server = new BedrockServer(cwd);
  const world = server.getCurrentWorld();
  console.log(world.addons.getAllAddons().map(addon => ({
    path: addon.addonPath,
    name: `[${addon.type}] ${addon.getName()}@${addon.getVersion()}`,
    uuid: addon.getUuid()
  })));
}
