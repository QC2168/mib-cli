import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "path";
import { homedir } from "node:os";
import getCParams from "./utils/getCParams";

// 备份节点
export interface SaveItemType {
  path: string;
  comment: string;
  full?: boolean;
  output?: string;
  id?: number;
  checkHash? :boolean;
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

export const setConfig = (cfgPath:string, conf:ConfigType) => {
  writeFileSync(cfgPath, JSON.stringify(conf), {
    encoding: "utf8",
  });
};

export const addNode = (data:SaveItemType, cfgPath = DEFAULT_CONFIG_PATH): ConfigType => {
  const cfg = getConfig(cfgPath);
  cfg.backups.push({ ...data, id: Date.now() });
  setConfig(cfgPath, cfg);
  return cfg;
};

export const removeNode = (id:number, cfgPath = DEFAULT_CONFIG_PATH):ConfigType => {
  const cfg = getConfig(cfgPath);
  const index = cfg.backups.findIndex((i) => i.id === id);
  if (index === -1) {
    return cfg;
  }
  cfg.backups.splice(index, 1);
  setConfig(cfgPath, cfg);
  return cfg;
};

// eslint-disable-next-line max-len
export const editNode = (data:SaveItemType, cfgPath = DEFAULT_CONFIG_PATH):ConfigType => {
  const cfg = getConfig(cfgPath);
  if (!(data?.id)) {
    return cfg;
  }
  const index = cfg.backups.findIndex((i) => i.id === data.id);
  if (index === -1) {
    return cfg;
  }
  cfg.backups[index] = data;
  setConfig(cfgPath, cfg);
  return cfg;
};

export const editOutputPath = (output:string, cfgPath = DEFAULT_CONFIG_PATH):ConfigType => {
  const cfg = getConfig(cfgPath);
  cfg.output = output;
  setConfig(cfgPath, cfg);
  return cfg;
};
