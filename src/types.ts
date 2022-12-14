// 文件节点
export interface FileNodeType {
  fileSize: number;
  fileName: string;
  filePath: string;
  isDirectory: boolean;
  fileMTime?: string | Date;
  children: FileNodeType[] | null;
}

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
  adbPath: string;
}

// 设备列表
export interface devicesType {
  name: string;
  status: string;
}
