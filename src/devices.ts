import prompts from "prompts";
import { DevicesType } from "./types";
import log from './utils/logger';
import { execAdb } from "./utils/adb";

// 获取设备
export const devices = (): DevicesType[] => {
  const res = execAdb("devices");
  return res
    .split(/\n/)
    .map((line) => line.split("\t"))
    .filter((line) => line.length > 1)
    .map((device) => ({
      name: device[0].trim(),
      status: device[1].trim(),
    }));
};

// 指定设备
export const selectDevice = async (): Promise<string | null> => {
  // 获取设备
  const list: DevicesType[] = devices();

  if (list.length === 0) {
    log("当前无设备连接，请连接后再执行该工具", "warn");
    return null;
  }

  const result = list.map((i) => ({ title: i.name, value: i.name }));

  const { value } = await prompts({
    type: "select",
    name: "value",
    message: "please select your device",
    choices: result,
  });
  // 获取设备状态
  const deviceStatus = list.find((i) => i.name === value)?.status;
  if (deviceStatus === "unauthorized") {
    log("该设备无权访问权限", "warn");
    log("请在设备上允许USB调试", "warn");
    return null;
  }

  return value;
};
