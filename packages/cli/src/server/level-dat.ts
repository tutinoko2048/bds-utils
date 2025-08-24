import * as fs from 'node:fs';
import path from 'node:path';
import { BinaryStream, Endianness } from '@serenityjs/binarystream';
import { CompoundTag } from '@serenityjs/nbt';
import * as pc from 'picocolors';

export interface LevelDatHeader {
  version: number;
  length: number;
}

const nbtOptions = {
  name: false,
  type: false,
  varint: false,
  endian: Endianness.Little
};
 
export class LevelDat {
  private header!: LevelDatHeader;
  private data!: CompoundTag;

  private isLoaded = false;

  constructor(public readonly filePath: string) {}

  getRootTag(): CompoundTag {
    if (!this.isLoaded) this.load();
    const root = this.data.get<CompoundTag>('');
    if (!root) throw new Error('Root tag not found');
    return root;
  }

  load() {
    const levelDatBuffer = fs.readFileSync(this.filePath);

    const stream = new BinaryStream(levelDatBuffer);
    this.header = {
      version: stream.readInt32(Endianness.Little),
      length: stream.readInt32(Endianness.Little),
    };
    this.data = CompoundTag.read(stream, nbtOptions);

    this.isLoaded = true;
  }
  
  save() {
    if (!this.isLoaded) throw new Error('level.dat is not loaded');
    if (!this.header || !this.data) throw new Error('Cannot save level.dat: missing header or data');

    const nbtStream = new BinaryStream();
    CompoundTag.write(nbtStream, this.data, nbtOptions);

    const nbtBuffer = nbtStream.getBuffer();

    const stream = new BinaryStream();
    stream.writeInt32(this.header.version, Endianness.Little);
    stream.writeInt32(nbtBuffer.byteLength, Endianness.Little);
    stream.write(nbtBuffer);

    fs.writeFileSync(this.filePath, stream.getBuffer());
  }

  restore() {
    console.log(pc.dim('[LevelDat] copying level.dat_old to level.dat...'));

    fs.copyFileSync(
      path.join(path.dirname(this.filePath), 'level.dat_old'),
      this.filePath
    );

    this.isLoaded = false; // Reset loaded state to force reload next time
  }
}