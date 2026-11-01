import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  dts: true,
  // package.json の main/types (.js/.d.ts) に合わせる
  fixedExtension: false,
});
