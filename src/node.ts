/* eslint-disable no-restricted-syntax */
import { readdirSync, statSync } from "fs";
import { execAdb, ExecAdbOptions, isPathAdb } from "./utils/adb";
import pathRepair from "./utils/pathRepair";
import { getFileHashLocal, getFileHashMobile } from "./utils/hash";

export default {};

// 文件节点
export interface FileNodeType {
  fileSize: number;
  fileName: string;
  filePath: string;
  isDirectory: boolean;
  fileMTime?: string | Date;
  children: FileNodeType[] | null;
  hash?: string|null;
}

export interface DiffOptionType{
  checkMD5:boolean
}
// 获取文件列表
interface GetMobileNodesOptionType{
  targetPath: string,
  deep?:boolean,
  adbOpt:ExecAdbOptions,
  hash?:boolean
}
export function getMobileFileNodeList(
  opt:GetMobileNodesOptionType,
): FileNodeType[] {
  const {
    targetPath,
    deep = true,
    adbOpt,
    hash = false,
  } = opt;
  if (!isPathAdb(targetPath, adbOpt)) return [];
  const res = execAdb(`shell ls -l ${targetPath}`, adbOpt).toString().split("\r\n");
  res.shift();
  res.pop();
  const fileNodeList: FileNodeType[] = [];

  res.forEach((str) => {
    const arr = str.split(/\s+/);
    if (arr[0].startsWith("-") || arr[0].startsWith("d")) {
      const fileName = arr.slice(7).join(" ");
      const fileSize = Number(arr.slice(4, 5).join());
      const filePath = `${targetPath}${fileName}`;
      const node: FileNodeType = {
        isDirectory: arr[0].startsWith("d"),
        fileName,
        fileSize,
        filePath,
        children:
                    arr[0].startsWith("d") && deep
                      ? getMobileFileNodeList({ targetPath: pathRepair(filePath), adbOpt })
                      : null,
        hash: hash ? getFileHashMobile(filePath, adbOpt) : null,
      };
      fileNodeList.push(node);
    }
  });

  return fileNodeList;
}

// 通过本地文件路径生成文件本地节点
export function createFileNode(
  targetFilePath: string,
  deep = true,
  hash = false,
): FileNodeType {
  const detail = statSync(targetFilePath);
  try {
    const children = [];
    if (detail.isDirectory() && deep) {
      for (const item of readdirSync(targetFilePath)) {
        children.push(createFileNode(pathRepair(targetFilePath) + item));
      }
    }
    return {
      fileSize: detail.size,
      fileName: targetFilePath.split("/").at(-1) ?? "读取文件名错误",
      filePath: targetFilePath,
      isDirectory: detail.isDirectory(),
      fileMTime: detail.mtime,
      children,
      hash: hash ? getFileHashLocal(targetFilePath) : null,
    };
  } catch (e) {
    return {
      fileSize: 0,
      fileName: targetFilePath.split("/").at(-1) ?? "读取文件名错误",
      filePath: targetFilePath,
      isDirectory: detail.isDirectory(),
      fileMTime: detail.mtime,
      children: [],
    };
  }
}

// 获取指定目录下文件节点
export interface GetLocalNodesOptionType{
  targetPath:string;
  deep?:boolean;
  hash?:boolean
}
// eslint-disable-next-line max-len
export function getLocalFileNodeList({ targetPath, deep = true, hash = false }:GetLocalNodesOptionType): FileNodeType[] {
  const fileNodeList: FileNodeType[] = [];
  const fileList = readdirSync(targetPath);
  for (const item of fileList) {
    try {
      const node = createFileNode(pathRepair(targetPath) + item, deep, hash);
      fileNodeList.push(node);
    } catch (error) {
      console.error(`${item}生成节点出错啦--${error}`);
      return [];
    }
  }

  return fileNodeList;
}

export function diff(
  localArr: FileNodeType[],
  remoteArr: FileNodeType[],
  option:Partial<DiffOptionType> = {},
): FileNodeType[] {
  const { checkMD5 = false } = option;
  if (localArr.length === 0 && remoteArr.length > 0) {
    return remoteArr;
  }
  const temp: FileNodeType[] = [];
  for (let i = 0; i < remoteArr.length; i += 1) {
    const item = remoteArr[i];
    const { fileName: name, hash } = item;
    for (let j = 0; j < localArr.length; j += 1) {
      // 匹配名称成功
      if (name === localArr[j].fileName) {
        if (item.children && item.children.length > 0) {
          const node = {
            ...item,
            children: diff(localArr[j].children || [], item.children, option),
          };
          if (node.children.length > 0) temp.push(node);
        }
        if (checkMD5 && hash !== localArr[j].hash) {
          temp.push(item);
        }
        break;
      }
      // 当匹配不到文件存在
      if (j === localArr.length - 1) {
        temp.push(item);
        break;
      }
    }
  }

  return temp;
}

export function computeNodeListSize(list: FileNodeType[]): number {
  return list.reduce((size, n2) => size + n2.fileSize, 0);
}
