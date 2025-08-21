import * as fs from 'node:fs';
import * as path from 'node:path';
import * as jsonc from 'jsonc-parser';
import { Addon } from './addon';
import { tryReadFileSync } from '../../util';
import { PackStack } from './types';

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

  getAllAddons() {
    return [
      ...this.getDevelopmentBehaviorPacks(),
      ...this.getWorldBehaviorPacks(),
      ...this.getDevelopmentResourcePacks(),
      ...this.getWorldResourcePacks(),
    ];
  }

  private getDevelopmentBehaviorPacks() {
    return this.getDirectoryPacks(path.join(this.serverPath, 'development_behavior_packs'), 'behavior');
  }
  
  private getDevelopmentResourcePacks() {
    return this.getDirectoryPacks(path.join(this.serverPath, 'development_resource_packs'), 'resource');
  }

  private getWorldBehaviorPacks() {
    return this.getDirectoryPacks(path.join(this.worldPath, 'behavior_packs'), 'behavior');
  }

  private getWorldResourcePacks() {
    return this.getDirectoryPacks(path.join(this.worldPath, 'resource_packs'), 'resource');
  }
  
  private getDirectoryPacks(directory: string, type: 'resource' | 'behavior'): Addon[] {
    const packs: Addon[] = [];
    if (!fs.existsSync(directory)) return packs;

    for (const dirent of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      const addonPath = path.join(dirent.parentPath, dirent.name);
      if (!Addon.isAddonDirectory(addonPath)) continue;
      const addon = new Addon(addonPath, type);
      packs.push(addon);
    }

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
