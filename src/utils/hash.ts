import crypto from 'crypto';
import { readFileSync } from 'fs';
import log from './logger';
import { execAdb, ExecAdbOptions } from "./adb";
import { getErrorMessage } from "./error";

export const getFileHashMobile = (path:string, opt:ExecAdbOptions):string|null => {
  try {
    const output = execAdb(`shell md5sum '${path}'`, opt).split(' ');
    return output[0];
  } catch {
    log(`分析文件${path}失败`, 'error');
    return null;
  }
};

export const getFileHashLocal = (path:string):string|null => {
  try {
    const data = readFileSync(path);
    const hash = crypto.createHash('md5').update(data).digest('hex');
    return hash;
  } catch (e) {
    log(`分析文件${path}失败`, 'error');
    log(getErrorMessage(e), 'error');
    return null;
  }
};
