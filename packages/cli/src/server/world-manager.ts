import * as fs from 'node:fs';
import * as path from 'node:path';
import { World } from './world';

export class WorldManager {
  private readonly worlds: World[] = [];

  constructor(
    serverPath: string,
    public readonly worldsPath: string
  ) {
    for (const dirent of fs.readdirSync(this.worldsPath, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;

      const worldName = dirent.name;
      const worldPath = path.join(this.worldsPath, worldName);
      if (!World.isWorldDirectory(worldPath)) continue;
      const world = new World(serverPath, worldPath);
      this.worlds.push(world);
    }
  }

  getWorld(name: string): World | undefined {
    return this.worlds.find(world => world.name === name);
  }

  getWorlds(): World[] {
    return this.worlds;
  }
}