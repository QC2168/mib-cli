import esbuild from "esbuild";
import config, { esm, cjs, dev } from "./config.js";

esbuild
  .build({
    ...config,
    ...esm,
    ...dev,
    outdir: "/dist/es",
    entryPoints: ["src/index.ts"],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...config,
    ...cjs,
    ...dev,
    outdir: "/dist/cjs",
    bundle: true,
    entryPoints: ["src/index.ts"],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...config,
    ...cjs,
    ...dev,
    outfile: "/dist/bin/index.js",
    entryPoints: ["src/bin.ts"],
    bundle: true,
    external: ["./node_modules/*"],
  })
  .catch(() => process.exit(1));
