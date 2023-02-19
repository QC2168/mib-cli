import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "path";
import { homedir } from "node:os";
import getCParams from "./utils/getCParams";

// 备份节点
export interface SaveItemType {
  path: string;
  comment: string;
  full?: boolean;
  output?:string;
}

// 备份目标
export interface ConfigType {
  backups: SaveItemType[];
  output: string;
  adbPath?: string;
}

const params = getCParams();
// export const home = platform === "win32" ? env.USERPROFILE : env.HOME;
export const home = homedir();

// 获取配置文件名称
const DEFAULT_CONFIG_FILE_NAME = ".mibrc";
// eslint-disable-next-line max-len
export const DEFAULT_CONFIG_PATH: string = (params.config && existsSync(params.config) && params.config)
  || path.join(home || "~/", DEFAULT_CONFIG_FILE_NAME);

const existConf = () => existsSync(DEFAULT_CONFIG_PATH);
const createDefaultConfig = (cfgPath = DEFAULT_CONFIG_PATH): ConfigType => {
  const conf: ConfigType = {
    backups: [],
    output: "C:/",
    adbPath: "",
  };
  writeFileSync(cfgPath, JSON.stringify(conf), {
    encoding: "utf8",
  });
  const data = readFileSync(cfgPath, "utf8");
  return JSON.parse(data);
};

export const getConfig = (cfgPath = DEFAULT_CONFIG_PATH): ConfigType => {
  if (existConf()) {
    const data = readFileSync(cfgPath, "utf8");
    return JSON.parse(data);
  }
  // 找不到配置文件
  return createDefaultConfig(cfgPath);
};
