import * as fs from 'node:fs';
import * as path from 'node:path';
import * as jsonc from 'jsonc-parser';
import { Addon } from './addon';
import { tryReadFileSync } from '../../util';
import { PackStack } from './types';
import { ManifestNotFoundError } from './errors';

export class AddonManager {
  public readonly enabledBehaviorPacks: PackStack[] = [];
  public readonly enabledResourcePacks: PackStack[] = [];

  constructor(
    private readonly serverPath: string,
    private readonly worldPath: string
  ) {
    this.loadBehaviorPacksJson();
    this.loadResourcePacksJson();
  }

  saveEnabledBehaviorPacks() {
    const json = JSON.stringify(this.enabledBehaviorPacks, null, 2);
    fs.writeFileSync(path.join(this.worldPath, 'world_behavior_packs.json'), json);
  }

  saveEnabledResourcePacks() {
    const json = JSON.stringify(this.enabledResourcePacks, null, 2);
    fs.writeFileSync(path.join(this.worldPath, 'world_resource_packs.json'), json);
  }

  async getAllAddons() {
    return (await Promise.all([
      this.getDevelopmentBehaviorPacks(),
      this.getWorldBehaviorPacks(),
      this.getDevelopmentResourcePacks(),
      this.getWorldResourcePacks(),
    ])).flat();
  }

  private async getDevelopmentBehaviorPacks() {
    return await this.getDirectoryPacks(path.join(this.serverPath, 'development_behavior_packs'), 'behavior');
  }

  private async getDevelopmentResourcePacks() {
    return await this.getDirectoryPacks(path.join(this.serverPath, 'development_resource_packs'), 'resource');
  }

  private async getWorldBehaviorPacks() {
    return await this.getDirectoryPacks(path.join(this.worldPath, 'behavior_packs'), 'behavior');
  }

  private async getWorldResourcePacks() {
    return await this.getDirectoryPacks(path.join(this.worldPath, 'resource_packs'), 'resource');
  }

  private async getDirectoryPacks(directory: string, type: 'resource' | 'behavior'): Promise<Addon[]> {
    const packs: Addon[] = [];
    if (!fs.existsSync(directory)) return packs;

    const load = async (dirent: fs.Dirent) => {
      const addonPath = path.join(dirent.parentPath, dirent.name);
      try {
        const manifest = await Addon.readManifest(dirent);
        const addon = new Addon(addonPath, type, manifest);
        packs.push(addon);
      } catch (error) {
        if (!(error instanceof ManifestNotFoundError)) {
          console.error(`[AddonManager] Failed to load addon from ${addonPath}:\n`, error);
        }
      }
    };

    const promises = fs.readdirSync(directory, { withFileTypes: true }).map(load);
    await Promise.all(promises);

    return packs;
  }

  private loadBehaviorPacksJson() {
    const file = tryReadFileSync(path.join(this.worldPath, 'world_behavior_packs.json'));
    if (!file) return;
    const json = jsonc.parse(file);
    this.enabledBehaviorPacks.push(...json);
  }
  
  private loadResourcePacksJson() {
    const file = tryReadFileSync(path.join(this.worldPath, 'world_resource_packs.json'));
    if (!file) return;
    const json = jsonc.parse(file);
    this.enabledResourcePacks.push(...json);
  }
}
