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

const speedReg: RegExp = /[0-9.]+\sMB\/s/;

export default class Mib {
  public readonly adbOpt: ExecAdbOptions;

  public readonly config: ConfigType;

  constructor(configPath = DEFAULT_CONFIG_PATH) {
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

  diffNode(backupDir: string, outputDir: string) {
    const mobileFileNodeList: FileNodeType[] = getMobileFileNodeList({
      targetPath: backupDir,
      adbOpt: this.adbOpt,
    });
    // 获取当前存储空间
    const localFileNodeList: FileNodeType[] = getLocalFileNodeList(outputDir);
    // 对比文件
    const diffList: FileNodeType[] = diff(
      localFileNodeList,
      mobileFileNodeList,
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

  backup(target: string, output: string, full: boolean = false) {
    if (!this.adbOpt.current) {
      log("请先连接设备");
      return;
    }
    if (!full) {
      // 备份非备份的文件数据
      // 获取手机中的文件信息,对比本地
      const { diffList } = this.diffNode(target, output);
      // 计算体积和数量
      computeNodeListSize(diffList);
      // 执行备份程序
      const orders = createAdbOrders(diffList, output);
      if (orders.length === 0) {
        log("无需备份");
        return;
      }
      this.move(orders);
    } else {
      // 不文件对比，直接备份
      this.moveFolder(target, output);
    }
  }

  start(item: SaveItemType) {
    const { output } = this.config;

    if (!this.adbOpt.current) {
      log("请先连接设备");
      throw new Error('please connect your devices');
    }

    log(`当前执行备份任务:${item.comment}`);
    const arr = item.path.split("/").filter((i: string) => i !== "");
    const folderName = arr.at(-1);
    const backupDir = pathRepair(item.path);
    // 备份目录
    // 判断节点内是否有备份目录  // 拼接导出路径
    const rootPath = pathRepair(pathRepair(output) + folderName);
    const outputDir = item.output
      ? item.output && pathRepair(item.output)
      : rootPath;
    // 判断备份路径是否存在
    if (!isPathAdb(backupDir, this.adbOpt)) {
      log(`备份路径:${backupDir} 不存在已跳过`, "error");
    } else {
      // 判断导出路径
      isPath(outputDir);
      this.backup(backupDir, outputDir, item.full);
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
}
