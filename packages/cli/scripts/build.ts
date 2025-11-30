import packageJson from "../package.json" with { type: "json" };

await Bun.build({
  entrypoints: ["src/main.ts"],
  outdir: "dist",
  target: "node",
  format: "esm",
  external: Object.keys(packageJson.dependencies), // updater-coreを除外するため
});

console.log("Build completed.");

