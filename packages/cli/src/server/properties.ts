import * as fs from 'node:fs';
import * as pc from 'picocolors';
import { formatPath } from '../util';

export class ServerProperties {
  private properties!: Record<string, string | number | boolean | undefined>;
  
  constructor(
    serverPath: string,
    public readonly filePath: string
  ) {
    const data = fs.readFileSync(this.filePath, 'utf-8');
    this.properties = this.parseProperties(data);
    // console.log(
    //   pc.dim(`[ServerProperties] Server properties loaded from: ${formatPath(serverPath, this.filePath)}`)
    // );
  }

  getValue<T extends string | number | boolean>(key: string): T | undefined {
    return this.properties[key] as T | undefined;
  }

  private parseValue(value: string): string | number | boolean | undefined {
    const trimmed = value.trim();
    
    if (trimmed === '') return undefined;
    
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!isNaN(num)) return num;
    }
    
    return trimmed;
  }

  private parseProperties(data: string): Record<string, string | number | boolean | undefined> {
    const lines = data.split('\n');
    const properties: Record<string, string | number | boolean | undefined> = {};

    for (const line of lines) {
      const match = line.match(/^\s*([\w-]+)\s*=\s*(.*)\s*$/);
      if (match) {
        properties[match[1]] = this.parseValue(match[2]);
      }
    }

    return properties;
  }
}