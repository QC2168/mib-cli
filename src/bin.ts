import { selectDevice } from "./devices";
import Mib from "./mib";
import log from "./utils/logger";

(async () => {
  const i = new Mib();
  const device: string|null = await selectDevice(i.config.adbPath ?? 'adb.exe');
  if (device) {
    i.setDevice(device);
    i.startAll();
    log("程序结束");
  }
})();
