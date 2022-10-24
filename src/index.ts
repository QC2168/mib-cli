/* eslint-disable no-restricted-syntax */
import { execSync } from "child_process";
import fs from "fs-extra";
import { FileNodeType, SaveItemType } from "./types";
import {
  diff, log, isPath, replace,
} from "./utils";
import { getConfig } from "./config";

const speedReg: RegExp = /[0-9.]+\s(MB\/s)/;

// 获取手机中文件的大小
const getFileSize = (path: string): number => {
  try {
    const res = execSync(
      `adb shell du -k "${replace(path)}" | adb shell cut -f 1`,
    ).toString();
    return Number(res);
  } catch (error) {
    log(`获取文件大小失败-${path}`, 'warn');
    return 0;
  }
};

const getCurFileList = (path: string) => {
  const res: string[] = execSync(`adb shell ls -l ${path}`)
    .toString()
    .split("\r\n");
  // 去除开头的total
  res.shift();
  // 去除最后一个字符串
  res.pop();

  const fileNames: string[] = [];
  res.forEach((str) => {
    const arr: string[] = str.split(/\s+/);
    if (arr[0].startsWith("-")) {
      const arrName = arr.slice(7).join(" ");
      fileNames.push(arrName);
    }
  });

  return fileNames;
};

const initData = (backupDir: string, outputDir: string) => {
  const phoneFileList: string[] = getCurFileList(backupDir);
  // 将带空白的名称替换
  if (phoneFileList[phoneFileList.length - 1] === "") {
    // if (phoneFileList.at(-1)=== '') {
    phoneFileList.pop();
  }
  // 获取当前存储空间
  const localFileList: string[] = fs.readdirSync(outputDir);
  // 对比文件
  const diffList: string[] = diff(localFileList, phoneFileList);
  // 将需要备份的文件转成文件节点
  // 细化备份数据列表
  const backupQueue: FileNodeType[] = [];
  for (const fileName of diffList) {
    const curFileNode: FileNodeType = {
      fileSize: getFileSize(`${backupDir}${fileName}`),
      fileName,
      filePath: backupDir + fileName,
    };
    backupQueue.push(curFileNode);
  }
  return {
    phoneFileList,
    localFileList,
    backupQueue,
  };
};

const computeBackupSize = (backupQueue: FileNodeType[]): number => {
  // 计算备份数量
  log(`备份数量${backupQueue.length}`);
  // 计算备份总体积
  let backupSize = 0;
  backupQueue.forEach((item) => {
    backupSize += item.fileSize;
    log(`已获取数据${backupSize / 1000}Mb`);
  });
  log(`备份体积${backupSize / 1000}Mb`);
  return backupSize;
};

const move = (backupQueue: FileNodeType[], outputDir: string): void => {
  if (backupQueue.length === 0) {
    log("无需备份");
    return;
  }
  for (const fileN of backupQueue) {
    log(`正在备份${fileN.fileName}`);
    try {
      const out: string = execSync(
        `adb pull "${fileN.filePath}" "${outputDir + fileN.fileName}"`,
      ).toString();
      const speed: string | null = out.match(speedReg) !== null ? out.match(speedReg)![0] : "读取速度失败";
      log(`平均传输速度${speed}`);
    } catch (e: any) {
      log(`备份${fileN.fileName}失败 error:${e.message}`, "error");
    }
  }
};

// backupFn
const backup = (target: string, output: string) => {
  // 获取手机中的文件信息,对比本地
  const { backupQueue } = initData(target, output);
  // 计算体积和数量
  computeBackupSize(backupQueue);
  // 执行备份程序
  move(backupQueue, output);
};

const MIB = () => {
  // 获取配置文件
  const { backups, output } = getConfig();
  isPath(output);
  // 解析备份路径最后一个文件夹
  backups.forEach((item: SaveItemType) => {
    log(`当前执行备份任务:${item.comment}`);
    const arr = item.path.split("/").filter((i: string) => i !== "");
    const folderName = arr[arr.length - 1];
    // 拼接导出路径
    const outputDir = `${output + folderName}/`;
    // 判断导出路径
    isPath(outputDir);
    const backupDir = item.path;
    backup(backupDir, outputDir);
  });
  log("程序结束");
};

MIB();
