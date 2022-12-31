import { execSync } from 'node:child_process';
import { getConfig } from '../config';

export interface ExecAdbOptions {
    currentDeviceName?: string;
    adbPath?: string;
}

const PATH_REG = /adb\.exe$/;

const { adbPath: userAdbPath } = getConfig();

export const execAdb = (code: string, option: ExecAdbOptions = {}) => {
  const {
    currentDeviceName = '',
    adbPath = userAdbPath || 'adb.exe',
  } = option;
  if (!PATH_REG.test(adbPath!)) {
    throw new Error('请输入正确的ADB.exe路径');
  }

  const command = `${adbPath} ${
    currentDeviceName ? `-s ${currentDeviceName}` : ""
  } ${code}`;
  return execSync(command).toString();
};

export const isPathAdb = (folderPath: string, device: string): boolean => {
  try {
    execAdb(`shell ls -l "${folderPath}"`, { currentDeviceName: device });
    return true;
  } catch {
    return false;
  }
};

export default execAdb;
