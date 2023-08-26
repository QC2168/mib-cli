const config = {
  minify: false,
  platform: "node",
  treeShaking: true,
  tsconfig: "tsconfig.json",
  loader: { ".ts": "ts" },
  logLevel: "info",
  target: ['esnext'],
  bundle: true,
};

export const esm = {
  format: "esm", outExtension: { '.js': '.mjs' },
};
export const cjs = {
  format: "cjs", outExtension: { '.js': '.cjs' },
};
export const dev = {
  ...config,
  sourcemap: true,
};
export const buildConfig = {
  ...config, minify: true, sourcemap: false,
};
export default config;
