import * as fs from 'node:fs';
import * as path from 'node:path';
import * as jsonc from 'jsonc-parser';
import JSZip from 'jszip';
import { Manifest, Uuid, Version } from './types';
import { ManifestNotFoundError } from './errors';
import { normalizeVersion } from '../../util';

export class Addon {
  constructor(
    public readonly addonPath: string,
    public readonly type: 'resource' | 'behavior',
    private readonly manifest: Manifest,
  ) {}

  getName(): string {
    return this.manifest.header.name;
  }

  getVersion(): string {
    return normalizeVersion(this.manifest.header.version);
  }

  getUuid(): Uuid {
    return this.manifest.header.uuid;
  }

  hasScript(): boolean {
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

  equals(uuid: Uuid, version: Version) {
    return (
      uuid === this.getUuid() &&
      normalizeVersion(version) === this.getVersion()
    );
  }

  toJSON() {
    return {
      name: this.getName(),
      version: this.getVersion(),
      uuid: this.getUuid(),
      path: this.addonPath,
    }
  }
}