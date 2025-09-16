import * as fs from 'node:fs';
import * as path from 'node:path';
import * as jsonc from 'jsonc-parser';
import JSZip from 'jszip';
import { AddonLocation, AddonType, Manifest, PackData, Uuid, Version } from './types';
import { ManifestNotFoundError } from './errors';
import { normalizeVersion } from '../../util';

export class Addon {
  constructor(
    public readonly addonPath: string,
    public readonly location: AddonLocation,
    public readonly type: AddonType,
    private readonly manifest: Manifest,
  ) {}

  get name(): string {
    return this.manifest.header.name;
  }

  get normalizedVersion(): string {
    return normalizeVersion(this.manifest.header.version);
  }

  get version(): Version {
    return this.manifest.header.version;
  }

  get uuid(): Uuid {
    return this.manifest.header.uuid;
  }

  get hasScript(): boolean {
    return this.manifest.modules.some(module => module.type === 'script');
  }

  static async readManifest(dirent: fs.Dirent): Promise<Manifest> {
    const addonPath = path.join(dirent.parentPath, dirent.name);
    
    let content: string;
    if (dirent.isDirectory()) {
      content = fs.readFileSync(path.join(addonPath, 'manifest.json'), 'utf-8');

    } else if (dirent.isFile() && ['.zip', '.mcpack'].includes(path.extname(addonPath))) {
      const buffer = fs.readFileSync(addonPath);
      const zip = await JSZip.loadAsync(buffer);
      
      const manifestFile = zip.file('manifest.json');
      if (!manifestFile) throw new ManifestNotFoundError();
      
      content = await manifestFile.async('string');

    } else {
      throw new ManifestNotFoundError();
    }

    return jsonc.parse(content);
  }

  equals(packData: PackData): boolean {
    return (
      packData.pack_id === this.uuid &&
      normalizeVersion(packData.version) === this.normalizedVersion
    );
  }

  toJSON() {
    return {
      name: this.name,
      version: this.version,
      uuid: this.uuid,
      path: this.addonPath,
    }
  }
}