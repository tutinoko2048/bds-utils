import * as path from 'node:path';
import { Readable, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pathExists } from 'fs-extra';
import * as unzip from 'unzip-stream';
import * as pc from 'picocolors';

import type { CacheManager } from './CacheManager';
import { permissionsJsonMerger, serverPropertiesMerger, type MergeInfo } from './Merge';
import type { VersionInfo } from './types';
import { safeCopy } from './utils/fsExtra';
import { ProgressBar } from './progress';
import { FileProgressTracker } from './file-progress';


const KEEP_ITEMS: [string, MergeInfo][] = [
  ['allowlist.json', {}],
  ['permissions.json', {}],
  ['whitelist.json', {}],
  ['server.properties', serverPropertiesMerger],
  ['config/default/permissions.json', permissionsJsonMerger]
];

KEEP_ITEMS.forEach(item => item[0] = path.normalize(item[0]));

export class Installer {
  constructor(private cacheManager: CacheManager) {}

  private get newServerFolder(): string {
    return this.cacheManager.cachedServerFolder;
  }

  public static async install(version: VersionInfo, cacheManager: CacheManager): Promise<void> {
    const installer = new Installer(cacheManager);
    
    if (cacheManager.isVersionCached(version.version)) {
      console.log(pc.yellow(`📦 Using cached version: ${version.version}`));
    } else {
      await installer.downloadAndExtractServer(version);
      console.log(pc.green('✅ Download completed'));
      cacheManager.markVersionDownloaded(version.version);
    }

    console.log();
    console.log(pc.cyan('🔄 Updating server files...'));
    await installer.updateFiles();
    console.log(pc.green('✅ All files updated'));

    if (process.platform !== 'win32') {
      const bedrockServer = path.join(cacheManager.serverFolder, 'bedrock_server');
      const currentMode = (await fs.stat(bedrockServer)).mode;
      await fs.chmod(bedrockServer, currentMode | fs.constants.S_IXUSR);
      console.log(pc.blue('\n🔧 Added execute permission to bedrock_server'));
    }
    
    // Clear cache after successful installation
    console.log(pc.dim('\n🧹 Cleaning up cache...'));
    cacheManager.clearCache();
  }

  async downloadAndExtractServer(version: VersionInfo): Promise<void> {
    const platform = process.platform === 'win32' ? 'win' : 'linux';
    const url = `https://www.minecraft.net/bedrockdedicatedserver/bin-${platform}${version.isPreview?'-preview':''}/bedrock-server-${version.version}.zip`;

    console.log(pc.dim(`URL: ${url}`));
    console.log();

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch bedrock server: ${res.status} ${res.statusText}\n${url}`);
    }

    const totalBytes = Number(res.headers.get('content-length'));
    const progressBar = new ProgressBar('📥 Downloading server', totalBytes);
    
    let downloadedBytes = 0;
    const progressStream = new Transform({
      transform(chunk, _, cb) {
        downloadedBytes += chunk.length;
        progressBar.update(downloadedBytes);
        cb(null, chunk);
      },
    });

    const writeStream = new Writable({
      objectMode: true,
      write: (entry: unzip.Entry, _, cb) => {
        const processEntry = async () => {
          const filePath = path.join(this.newServerFolder, entry.path);

          if (entry.type === 'Directory') {
            await fs.mkdir(filePath, { recursive: true });
            entry.autodrain();
            return;
          }

          await fs.mkdir(path.dirname(filePath), { recursive: true });

          await pipeline(entry, createWriteStream(filePath));
        }

        processEntry().then(() => cb()).catch(cb);
      }
    });

    try {
      await pipeline(
        Readable.fromWeb(res.body),
        progressStream,
        unzip.Parse(),
        writeStream,
      );

    } finally {
      progressBar.stop();
    }
  }

  async updateFiles() {
    const tracker = new FileProgressTracker();
    await this.scanDir(this.newServerFolder, '', tracker);
    tracker.finish();
  }

  async scanDir(base: string, paths: string = '', tracker: FileProgressTracker) {
    const basePath = path.join(base, paths);
    const promises: Promise<void>[] = [];
    const errors: string[] = [];
    
    for (const item of await fs.readdir(basePath, { withFileTypes: true })) {
      const relPath = path.join(paths, item.name);
      const newPath = path.join(base, relPath)
      
      // Skip .VERSION file (used for cache management)
      if (item.name === '.VERSION') {
        continue;
      }
      
      const ITEM = KEEP_ITEMS.find(([p]) => p.startsWith(relPath));
      // true: keep
      let result: true | undefined | Promise<string>;
      if (ITEM) {
        result = true;
        const info = ITEM[1];
        if (item.isDirectory()) {
          this.scanDir(base, relPath, tracker);
          continue;
        } else {
          if (info.onFile) result = info.onFile(newPath, this.cacheManager.serverFolder);
        }
      }
      const oldPath = path.join(this.cacheManager.serverFolder, paths, item.name);

      const exists = await pathExists(oldPath);

      if (result === undefined || !exists) { // replace
        tracker.addItem(item.name, 'REPLACE');
        promises.push(
          (async () => {
            tracker.startProcessing(item.name);
            try {
              await safeCopy(newPath, oldPath);
              tracker.completeItem(item.name, 'REPLACE');
            } catch (err: any) {
              const errorMsg = `Failed to replace ${item.name}: ${err.message}`;
              tracker.errorItem(item.name, errorMsg);
              errors.push(errorMsg);
            }
          })()
        );

      } else if (result === true) { // keep
        tracker.addItem(ITEM![0], 'KEEP');
        // KEEPは即座に完了
        tracker.completeItem(ITEM![0], 'KEEP');

      } else { // merge
        tracker.addItem(ITEM![0], 'MERGE');
        promises.push(
          (async () => {
            tracker.startProcessing(ITEM![0]);
            try {
              const value = await result;
              await fs.writeFile(oldPath, value);
              tracker.completeItem(ITEM![0], 'MERGE');
            } catch (err: any) {
              const errorMsg = `Failed to merge ${item.name}: ${err.message}`;
              tracker.errorItem(ITEM![0], errorMsg);
              errors.push(errorMsg);
            }
          })()
        );
      }
    }

    await Promise.all(promises);
    
    if (errors.length > 0) {
      throw new Error(`Failed to update files:\n${errors.join('\n')}`);
    }
  }
}
