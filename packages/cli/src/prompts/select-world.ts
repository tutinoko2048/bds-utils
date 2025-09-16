import * as path from 'node:path';
import * as pc from 'picocolors';
import { select } from '@inquirer/prompts';
import figures from '@inquirer/figures'
import { type BedrockServer, World } from '../server';

export async function selectWorldPrompt(server: BedrockServer): Promise<World> {
  const worlds = server.worlds.getWorlds();
  
  if (worlds.length === 0) throw new Error('No worlds available.');
  if (worlds.length === 1) {
    const world = server.getCurrentWorld();
    console.log(`${pc.green(figures.tick)} Target world: ${world.displayName} ${pc.dim(`(${path.relative(server.serverPath, world.worldPath)})`)}`);
    return world;
  }

  return await select({
    message: 'Select a world:',
    choices: worlds.map(w => ({
      name: `${w.displayName} ${pc.dim(`(${path.relative(server.serverPath, w.worldPath)})`)}`,
      value: w,
    }))
  });
}