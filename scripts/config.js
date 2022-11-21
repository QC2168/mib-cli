const config = {
  minify: false,
  platform: "node",
  treeShaking: true,
  tsconfig: "tsconfig.json",
  loader: { ".ts": "ts" },
  logLevel: "info",
  target: ['esnext'],
};

export const esm = {
  format: "esm", outExtension: { '.js': '.mjs' },
};
export const cjs = {
  format: "cjs", outExtension: { '.js': '.cjs' },
};
export const dev = {
  watch: true,
  sourcemap: true,
};
export default config;
export const buildConfig = {
  ...config, minify: true,
};
