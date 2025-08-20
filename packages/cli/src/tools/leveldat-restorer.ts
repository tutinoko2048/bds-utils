import * as pc from 'picocolors';
import { BedrockServer } from '../server';

export async function levelDatRestorer(cwd: string): Promise<void> {
  console.log(pc.bold(pc.green('Level.dat Restorer')));

  const server = new BedrockServer(cwd);
  const world = server.getCurrentWorld();

  world.levelDat.restore();

  console.log();
  console.log(pc.green('Successfully restored level.dat!'));
}