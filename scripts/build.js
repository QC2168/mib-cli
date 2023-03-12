import esbuild from "esbuild";
import { buildConfig, esm, cjs } from "./config.js";

esbuild
  .build({
    ...buildConfig,
    ...esm,
    outdir: "/dist/es",
    entryPoints: ["src/index.ts"],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...buildConfig,
    ...cjs,
    outdir: "/dist/cjs",
    entryPoints: ["src/index.ts"],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...buildConfig,
    ...esm,
    outfile: "/dist/bin/index.js",
    entryPoints: ["src/bin.ts"],
  })
  .catch(() => process.exit(1));
