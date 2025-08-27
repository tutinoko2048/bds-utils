import * as fs from 'node:fs';
import * as path from 'node:path';
import * as jsonc from 'jsonc-parser';
import { Addon } from './addon';
import { tryReadFileSync } from '../../util';
import { AddonType, PackStack } from './types';
import { ManifestNotFoundError } from './errors';

export class AddonManager {
  private enabledBehaviorPacks: PackStack[] = [];
  private enabledResourcePacks: PackStack[] = [];

  constructor(
    private readonly serverPath: string,
    private readonly worldPath: string
  ) {
    this.loadBehaviorPacksJson();
    this.loadResourcePacksJson();
  }

  isPackEnabled(addon: Addon): boolean {
    const currentPacks = addon.type === 'behavior' ? this.enabledBehaviorPacks : this.enabledResourcePacks;
    return currentPacks.some((pack) => addon.equals(pack.pack_id, pack.version));
  }

  getEnabledPacks(type: AddonType) {
    return type === 'behavior' ? this.enabledBehaviorPacks : this.enabledResourcePacks;
  }

  setEnabledPacks(type: AddonType, packs: PackStack[]) {
    if (type === 'behavior') {
      this.enabledBehaviorPacks = packs;
    } else {
      this.enabledResourcePacks = packs;
    }
  }

  saveEnabledBehaviorPacks() {
    const json = JSON.stringify(this.enabledBehaviorPacks, null, 2);
    fs.writeFileSync(path.join(this.worldPath, 'world_behavior_packs.json'), json);
  }

  saveEnabledResourcePacks() {
    const json = JSON.stringify(this.enabledResourcePacks, null, 2);
    fs.writeFileSync(path.join(this.worldPath, 'world_resource_packs.json'), json);
  }

  async getAddons(type: AddonType) {
    if (type === 'behavior') {
      return (await Promise.all([this.getDevelopmentBehaviorPacks(), this.getWorldBehaviorPacks()])).flat();
    } else {
      return (await Promise.all([this.getDevelopmentResourcePacks(), this.getWorldResourcePacks()])).flat();
    }
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

  private async getDirectoryPacks(directory: string, type: AddonType): Promise<Addon[]> {
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
