import esbuild from "esbuild";
import config, { esm, cjs, dev } from "./config.js";

esbuild
  .build({
    ...esm,
    ...dev,
    outdir: "/dist/es",
    entryPoints: ["src/index.ts"],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...cjs,
    ...dev,
    outdir: "/dist/cjs",
    entryPoints: ["src/index.ts"],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...config,
    ...cjs,
    ...dev,
    outfile: "/dist/bin/index.cjs",
    entryPoints: ["src/bin.ts"],
  })
  .catch(() => process.exit(1));
