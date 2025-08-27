import * as path from 'node:path';
import * as pc from 'picocolors';
import { AddonType, BedrockServer } from '../server';
import { selectWorld } from '../prompts';
import { select } from '@inquirer/prompts';

export async function addonManager(cwd: string): Promise<void> {
  console.log(pc.bold(pc.green('🛠️  Addon Manager')));
    
  const action = await select({
    message: 'Select an action:',
    choices: [
      {
        name: 'Edit behavior packs',
        value: () => editAddon(cwd, 'behavior'),
      },
      {
        name: 'Edit resource packs',
        value: () => editAddon(cwd, 'resource'),
      },
      {
        name: `${pc.red('✘')} Exit`,
        value: () => process.exit(),
      }
    ]
  });

  await action();
}

async function editAddon(serverPath: string, type: AddonType) {
  const server = new BedrockServer(serverPath);

  const world = await selectWorld(server);

  const addons = await world.addons.getAddons(type);

  const enabledPacks = world.addons.getEnabledPacks(type);

  // sort logic
  console.log('enabled packs', enabledPacks.map(pack => {
    const addon = addons.find(addon => addon.equals(pack.pack_id, pack.version));
    if (!addon) console.warn(`Addon: ${pack.pack_id}@${pack.version} not found`);
    return addon?.toJSON();
  }));
  
  // console.log(addons.map(addon => ({
  //   name: `[${addon.type}] ${addon.getName()}@${addon.getVersion()}`,
  //   uuid: addon.getUuid(),
  //   path: addon.addonPath,
  //   relativePath: path.relative(serverPath, addon.addonPath)
  // })));
}