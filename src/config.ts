import { platform, env } from "process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "path";

const HOME = platform === "win32" ? env.USERPROFILE : env.HOME;

export interface SaveItemType {
  path: string;
  comment: string;
  full?: boolean;
  output?: string;
}
export interface ConfigType {
  configFileName: string;
  configFilePath: string;
  adbPath: string;
  backups: SaveItemType[];
  output: string;
}

export default class Config {
  private configFileName: string;

  private configFilePath: string;

  private adbPath: string;

  constructor(config: ConfigType) {
    this.configFileName = config.configFileName ?? '.mibrc';
    this.configFilePath = config.configFilePath ?? path.join(HOME || "~/", this.configFileName);
    this.adbPath = config.adbPath;
  }

  existConf() {
    return existsSync(this.configFilePath);
  }

  createDefaultConfig(): ConfigType {
    const conf: ConfigType = {
      backups: [],
      output: "C:/",
      adbPath: this.adbPath,
      configFileName: this.configFileName,
      configFilePath: this.configFilePath,
    };
    writeFileSync(this.configFilePath, JSON.stringify(conf), {
      encoding: "utf8",
    });
    const data = readFileSync(this.configFilePath, "utf8");
    return JSON.parse(data);
  }

  getConfig(): ConfigType {
    if (this.existConf()) {
      const data = readFileSync(this.configFilePath, "utf8");
      return JSON.parse(data);
    }
    // 找不到配置文件
    return this.createDefaultConfig();
  }
}
