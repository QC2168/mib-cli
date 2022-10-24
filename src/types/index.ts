// 文件节点
export interface FileNodeType {
  fileSize: number
  fileName: string
  filePath: string
}

// 备份节点
export interface SaveItemType {
  path: string
  comment: string
  full?:boolean
}

// 备份目标
export interface BackupsType {
  backups: SaveItemType[]
  output: string
}
