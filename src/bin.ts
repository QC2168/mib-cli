import c from 'picocolors';
import { selectDevice } from "./devices";
import Mib from "./mib";
import log from "./utils/logger";
import { DEFAULT_CONFIG_PATH } from "./config";

(async () => {
  const i = new Mib();
  const cfg = i.getConfig();
  log(`${c.blue(`读取配置文件-> `)}${c.green(`${DEFAULT_CONFIG_PATH}`)}`, 'info');
  log(`${c.blue(`文件导出路径-> `)}${c.green(`${cfg.output}`)}`, 'info');
  log(`${c.blue(`备份节点数量-> `)}${c.green(`${cfg.backups.length}个`)}`, 'info');
  const device: string|null = await selectDevice(cfg.adbPath ?? 'adb.exe');
  if (device) {
    i.setDevice(device);
    i.startAll();
    log("程序结束");
  }
})();
