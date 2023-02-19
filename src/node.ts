/* eslint-disable no-restricted-syntax */
import { readdirSync, statSync } from "fs";
import { execAdb, ExecAdbOptions, isPathAdb } from "./utils/adb";
import pathRepair from "./utils/pathRepair";

export default {};

// 文件节点
export interface FileNodeType {
  fileSize: number;
  fileName: string;
  filePath: string;
  isDirectory: boolean;
  fileMTime?: string | Date;
  children: FileNodeType[] | null;
}

// 获取文件列表
interface pathType{
  targetPath: string,
  deep?:boolean,
  adbOpt:ExecAdbOptions
}
export function getMobileFileNodeList(
  opt:pathType,
): FileNodeType[] {
  const {
    targetPath,
    deep = true,
    adbOpt,
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
export function getLocalFileNodeList(targetPath: string, deep = true): FileNodeType[] {
  const fileNodeList: FileNodeType[] = [];
  const fileList = readdirSync(targetPath);
  for (const item of fileList) {
    try {
      const node = createFileNode(pathRepair(targetPath) + item, deep);
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
): FileNodeType[] {
  if (localArr.length === 0 && remoteArr.length > 0) {
    return remoteArr;
  }
  const temp: FileNodeType[] = [];
  for (let i = 0; i < remoteArr.length; i += 1) {
    const item = remoteArr[i];
    const name = item.fileName;
    for (let j = 0; j < localArr.length; j += 1) {
      if (name === localArr[j].fileName) {
        if (item.children && item.children.length > 0) {
          const node = {
            ...item,
            children: diff(localArr[j].children || [], item.children),
          };
          if (node.children.length > 0) temp.push(node);
        }
        break;
      }
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
