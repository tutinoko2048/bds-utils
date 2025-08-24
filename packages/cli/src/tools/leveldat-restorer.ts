import * as path from 'node:path';
import * as pc from 'picocolors';
import { BedrockServer } from '../server';
import { selectWorld } from '../prompts';
import { confirm } from '@inquirer/prompts';

export async function levelDatRestorer(cwd: string): Promise<void> {
  console.log(pc.bold(pc.green('🛠️  Level.dat Restorer')));

  const server = new BedrockServer(cwd);

  const world = await selectWorld(server);

  const res = await confirm({
    message: `Are you sure to restore level.dat in world: ${pc.yellow(world.displayName)} ${pc.reset(`(${path.relative(cwd, world.worldPath)})`)} ?`,
  });

  if (!res) {
    console.log(pc.red('Action aborted.'));
    return;
  }
  
  world.levelDat.restore();

  console.log();
  console.log(pc.green('Successfully restored level.dat!'));
}