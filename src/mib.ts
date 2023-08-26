import { join } from 'path';
import { execAdb, ExecAdbOptions, isPathAdb } from "./utils/adb";
import log from "./utils/logger";
import { createAdbOrders } from "./adbCmd";
import {
  computeNodeListSize,
  diff,
  FileNodeType,
  getLocalFileNodeList,
  getMobileFileNodeList,
} from "./node";
import { devices, type DevicesType } from "./devices";
import {
  DEFAULT_CONFIG_PATH,
  getConfig,
  type SaveItemType,
  type ConfigType,
} from "./config";
import isPath from "./utils/isPath";
import pathRepair from "./utils/pathRepair";
import { getErrorMessage } from "./utils/error";

const speedReg: RegExp = /[0-9.]+\sMB\/s/;
interface BackupOptionType{
  backupDir:string;
  outputDir:string;
  full?:boolean;
  hash?:boolean;
  deep?:true
}
export default class Mib {
  public readonly adbOpt: ExecAdbOptions;

  private config: ConfigType;

  private readonly configPath: string;

  constructor(configPath = DEFAULT_CONFIG_PATH) {
    this.configPath = configPath;
    this.config = getConfig(configPath);
    this.adbOpt = {
      adbPath: this.config.adbPath ?? "adb.exe",
      current: "",
    };
  }

  setDevice(name: string) {
    const deviceList = devices(this.adbOpt.adbPath).filter(
      (i: DevicesType) => i.status !== "unauthorized",
    );

    if (deviceList.findIndex((i: DevicesType) => i.name === name) === -1) {
      throw new Error("没有连接到该设备，无法执行设置为当前设备");
    }
    this.adbOpt.current = name;
  }

  diffNode({
    backupDir,
    outputDir, hash = false, deep = true,
  } :BackupOptionType) {
    const mobileFileNodeList: FileNodeType[] = getMobileFileNodeList({
      targetPath: backupDir,
      adbOpt: this.adbOpt,
      hash,
    });
    // 获取当前存储空间
    // eslint-disable-next-line max-len
    const localFileNodeList: FileNodeType[] = getLocalFileNodeList({ targetPath: outputDir, deep, hash });
    // 对比文件
    const diffList: FileNodeType[] = diff(
      localFileNodeList,
      mobileFileNodeList,
      { checkMD5: hash },
    );
    return {
      mobileFileNodeList,
      localFileNodeList,
      diffList,
    };
  }

  move(orders: string[]) {
    for (let i = 0; i < orders.length; i += 1) {
      const order = orders[i];
      try {
        const out: string = execAdb(order, this.adbOpt);
        const speed = out.match(speedReg) || ["读取速度失败"];
        log(`平均传输速度${speed}`);
      } catch (e: any) {
        const [info] = order.match(/(".+?")/g) || ["获取数据失败"];
        log(`${info} error:${e.message}`);
      }
    }
  }

  moveFolder(source: string, target: string) {
    log(`正在备份文件夹${source}`);
    try {
      const out: string = execAdb(`pull "${source}" "${target}"`, this.adbOpt);
      const speed = out.match(speedReg) || ["读取速度失败"];
      log(`平均传输速度${speed}`);
    } catch (e: any) {
      log(`备份文件夹${source}失败 error:${e.message}`);
    }
  }

  backup(target: string, output: string, opt:Partial<BackupOptionType> = {}) {
    const { full } = opt;
    if (!this.adbOpt.current) {
      log("请先连接设备");
      return;
    }
    if (!full) {
      // 备份非备份的文件数据
      // 获取手机中的文件信息,对比本地
      const { diffList } = this.diffNode({
        backupDir: target,
        outputDir: output,
        ...opt,
      });
      // 计算体积和数量
      computeNodeListSize(diffList);
      // 执行备份程序
      const orders = createAdbOrders(diffList, output);
      const count = orders.length;
      if (count === 0) {
        log("该节点本次无需备份");
        return;
      }
      log(`该节点本次需要备份数量${count}个`);
      this.move(orders);
    } else {
      // 不文件对比，直接备份
      this.moveFolder(target, output);
    }
  }

  start(item: SaveItemType) {
    const { output } = this.config;
    const { full, checkHash } = item;

    if (!this.adbOpt.current) {
      log("请先连接设备");
      throw new Error('please connect your devices');
    }

    log(`当前执行备份任务:${item.comment}`);
    const backupDir = pathRepair(item.path);
    // 备份目录
    // 判断节点内是否有备份目录
    const rootPath = pathRepair(output);
    const outputDir = item.output
      ? item.output && pathRepair(item.output)
      : join(rootPath, item.path);
    // 判断备份路径是否存在
    if (!isPathAdb(backupDir, this.adbOpt)) {
      log(`备份路径:${backupDir} 不存在已跳过`, "error");
    } else {
      // 判断导出路径
      isPath(outputDir);
      this.backup(backupDir, outputDir, { full, hash: checkHash });
    }
  }

  startAll() {
    const { backups, output } = this.config;
    if (backups.length === 0) return;
    // 判断路径
    isPath(output);
    backups.forEach((item: SaveItemType) => {
      this.start(item);
    });
  }

  setAdbPath(path: string) {
    this.adbOpt.adbPath = path;
  }

  restore(item: SaveItemType | SaveItemType[]) {
    const separatorReg = /[\\/]/;
    try {
      if (Array.isArray(item)) {
        for (let i = 0; i < item.length; i += 1) {
          const targetPath = item[i].path.substring(0, item[i].path.lastIndexOf('/'));
          execAdb(`push ${pathRepair(this.config.output + item[i].path)} ${pathRepair(targetPath)}`, this.adbOpt);
        }
      } else {
        const folderName = item.path.split(separatorReg).at(-1);
        const targetPath = item.path.substring(0, item.path.lastIndexOf('/'));
        execAdb(`push ${this.config.output + folderName} ${targetPath}`, this.adbOpt);
      }
    } catch (e: any) {
      log(`恢复数据时出错 ${getErrorMessage(e)}`);
    }
  }

  scanExt(exts: string[], target = '/sdcard/', ignorePrefixPaths:string[] = []) {
    const order = `shell find ${target} -name ${exts.join(' -o -name ')}`;
    const allPath = execAdb(order, this.adbOpt).split(/\r\n/);
    const node:string[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const item of allPath) {
      // ignore hidden folder and specify prefix paths
      if (ignorePrefixPaths.some((i) => item.startsWith(i)) || item.indexOf('/.') !== -1) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const path = item.split('/').slice(0, -1).join('/');
      if (!node.includes(path)) {
        node.push(path);
      }
    }
    return node;
  }

  public getConfig(): ConfigType {
    return this.config;
  }

  public reloadConfig(cfg:ConfigType|null = null): ConfigType {
    this.config = cfg ?? getConfig(this.configPath);
    return this.config;
  }
}
