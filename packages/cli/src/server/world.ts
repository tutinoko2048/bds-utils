import * as fs from 'node:fs';
import * as path from 'node:path';
import * as pc from 'picocolors';
import { formatPath, tryReadFileSync } from '../util';
import { LevelDat } from './level-dat';
import { AddonManager } from './addon';

export class World {
  public readonly name: string;
  public readonly displayName?: string;
  public readonly levelDat: LevelDat;
  public readonly addons: AddonManager;

  constructor(
    serverPath: string,
    public readonly worldPath: string
  ) {
    console.log(
      pc.dim(`[World] World loaded from: ${formatPath(serverPath, this.worldPath)}`)
    );

    this.name = path.basename(this.worldPath);
    this.displayName = tryReadFileSync(path.join(this.worldPath, 'levelname.txt'));
    if (!this.displayName) console.warn(pc.yellow('[World] levelname.txt not found'));

    this.levelDat = new LevelDat(path.join(this.worldPath, 'level.dat'));
    this.addons = new AddonManager(serverPath, this.worldPath);
  }

  static isWorldDirectory(dir: string): boolean {
    const paths: string[] = [
      'db',
      'level.dat',
      'level.dat_old'
    ];
    return paths.every((p) => fs.existsSync(path.join(dir, p)));
  }
}