import * as path from 'node:path';
import { ServerProperties } from './properties';
import { WorldManager } from './world-manager';
import { World } from './world';

export class BedrockServer {
  public readonly properties: ServerProperties;
  public readonly worlds: WorldManager;

  constructor(public readonly serverPath: string) {
    this.properties = new ServerProperties(serverPath, path.join(serverPath, 'server.properties'));
    this.worlds = new WorldManager(serverPath, path.join(serverPath, 'worlds'));
  }

  getCurrentWorld(): World {
    const worldName = this.properties.getValue<string>('level-name');
    if (!worldName) throw new Error('Failed to load level-name from server.properties');
    const world = this.worlds.getWorld(worldName);
    if (!world) throw new Error(`World not found: ${worldName}`);
    return world;
  }
}