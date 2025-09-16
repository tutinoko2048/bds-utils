import * as path from 'node:path';
import * as pc from 'picocolors';
import { confirm } from '@inquirer/prompts';
import { BedrockServer } from '../server';
import { selectWorldPrompt } from '../prompts';

export async function levelDatRestorer(cwd: string): Promise<void> {
  console.log(pc.bold(pc.blue('🔄  Level.dat Restorer')));

  const server = new BedrockServer(cwd);

  const world = await selectWorldPrompt(server);

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