import * as fs from 'node:fs';
import * as path from 'node:path';
import * as jsonc from 'jsonc-parser';
import { Manifest, Uuid } from './types';

export class Addon {
  private readonly manifest: Manifest;

  constructor(
    public readonly addonPath: string,
    public readonly type: 'resource' | 'behavior'
  ) {
    this.manifest = this.loadManifest();
  }

  getName(): string {
    return this.manifest.header.name;
  }

  getVersion(): string {
    const ver = this.manifest.header.version;
    return typeof ver === 'string' ? ver : ver.join('.');
  }

  getUuid(): Uuid {
    return this.manifest.header.uuid;
  }

  hasScript(): boolean {
    return this.manifest.modules.some(module => module.type === 'script');
  }

  loadManifest(): Manifest {
    const file = fs.readFileSync(path.join(this.addonPath, 'manifest.json'), 'utf-8');
    return jsonc.parse(file);
  }

  static isAddonDirectory(dir: string): boolean {
    return fs.existsSync(path.join(dir, 'manifest.json'));
  }
}