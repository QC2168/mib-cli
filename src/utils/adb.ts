import { execSync } from 'node:child_process';
import log from './logger';

export interface ExecAdbOptions {
    current?: string;
    adbPath: string;
}

const PATH_REG = /adb\.exe$/;

const checkOpt = (option:ExecAdbOptions) => {
  const {
    current,
    adbPath = 'adb.exe',
  } = option;
  if (!PATH_REG.test(adbPath!)) {
    throw new Error('请输入正确的ADB.exe路径');
  }
  return {
    current,
    adbPath,
  };
};

export const execAdb = (code: string, option:ExecAdbOptions) => {
  const {
    current,
    adbPath,
  } = checkOpt(option);
  const body = `${
    current ? `-s ${current}` : ""
  } ${code}`;
  const command = `${adbPath} ${body}`;
  log(`adb ${body}`, 'command');
  return execSync(command, {
    maxBuffer: 1024 ** 6,
  }).toString();
};

export const isPathAdb = (folderPath: string, option: ExecAdbOptions): boolean => {
  try {
    execAdb(`shell ls -l "${folderPath}"`, option);
    return true;
  } catch {
    return false;
  }
};

export default execAdb;
