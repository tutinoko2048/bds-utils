import * as fs from 'node:fs';
import * as path from 'node:path';

export function tryReadFileSync(filePath: string): string | undefined {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file at ${filePath}:`, error);
    return undefined;
  }
}

export function formatPath(cwd: string, filePath: string): string {
  return `{dir}${path.sep}${path.relative(cwd, filePath)}`;
}