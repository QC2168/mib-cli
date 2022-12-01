import esbuild from "esbuild";
import { buildConfig, esm, cjs } from "./config.js";

esbuild
  .build({
    ...buildConfig,
    ...esm,
    outdir: "/dist/es",
    bundle: true,
    entryPoints: ["src/index.ts"],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...buildConfig,
    ...cjs,
    outdir: "/dist/cjs",
    bundle: true,
    entryPoints: ["src/index.ts"],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...buildConfig,
    ...esm,
    outfile: "/dist/bin/index.js",
    entryPoints: ["src/bin.ts"],
    external: ["./node_modules/*"],
    bundle: true,
  })
  .catch(() => process.exit(1));
