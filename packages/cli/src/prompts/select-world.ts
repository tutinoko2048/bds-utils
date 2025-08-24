import * as path from 'node:path';
import { select } from '@inquirer/prompts';
import { type BedrockServer, World } from '../server';

export async function selectWorld(server: BedrockServer): Promise<World> {
  const worlds = server.worlds.getWorlds();
  
  if (worlds.length === 0) throw new Error('No worlds available.');
  if (worlds.length === 1) return server.getCurrentWorld();

  return await select({
    message: 'Select a world:',
    choices: worlds.map(w => ({
      name: `${w.displayName} (${path.relative(server.serverPath, w.worldPath)})`,
      value: w,
    }))
  });
}