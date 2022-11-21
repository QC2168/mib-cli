import esbuild from "esbuild";
import config, { esm, cjs } from "./config.js";

esbuild
  .build({
    ...config,
    ...esm,
    outdir: "/dist/es",
    entryPoints: ["src/adbCmd.ts", "src/backup.ts", "src/config.ts", "src/devices.ts", "src/node.ts"],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...config,
    ...cjs,
    outdir: "/dist/cjs",
    entryPoints: ["src/adbCmd.ts", "src/backup.ts", "src/config.ts", "src/devices.ts", "src/node.ts"],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    ...config,
    ...cjs,
    outfile: "/dist/bin/index.js",
    entryPoints: ["src/index.ts"],
    bundle: true,
    external: ["./node_modules/*"],
  })
  .catch(() => process.exit(1));
