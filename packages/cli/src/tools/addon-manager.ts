import * as path from 'node:path';
import * as pc from 'picocolors';
import { BedrockServer } from '../server';
import { selectWorld } from '../prompts';

export async function addonManager(cwd: string): Promise<void> {
  console.log(pc.bold(pc.green('🛠️  Addon Manager')));
  
  const server = new BedrockServer(cwd);

  const world = await selectWorld(server);
  
  const addons = await world.addons.getAllAddons();
  
  console.log(addons.map(addon => ({
    name: `[${addon.type}] ${addon.getName()}@${addon.getVersion()}`,
    uuid: addon.getUuid(),
    path: addon.addonPath,
    relativePath: path.relative(cwd, addon.addonPath)
  })));
}
