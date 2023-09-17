import path from "path";
import winston, { format } from "winston";
import { home } from "../config";

const {
  combine,
  simple,
  json,
  timestamp, printf,
} = format;

type levelType = "info" | "error" | "warn"|"command";

const levels = {
  info: 0,
  error: 1,
  warn: 2,
  command: 3,
};

const logger = winston.createLogger({
  levels,
  format: combine(
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    simple(),
    json(),
    printf(
      ({ level, message, timestamp: time }) => `${time} ${level} ${message}`,
    ),
  ),

  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(home || "./", "./MIB.log"),
    }),
    new winston.transports.File({
      filename: path.join(home || "./", "./MIB_ADB_EXEC.log"),
      level: 'command',
    }),
  ],
});
// 记录输出
export default (value: string, level: levelType = "info"): void => {
  logger.log(level, value);
};
