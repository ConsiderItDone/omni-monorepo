const getCurrentDate = (): Date => new Date();
const lowerCaseFirstLetter = (string = ""): string => {
  return string.charAt(0).toLowerCase() + string.slice(1);
};

export const Utils = {
  getCurrentDate,
  lowerCaseFirstLetter,
};

export { default as MQ } from "./mq";
export { default as tracer } from "./tracer";

export * as types from "./types";

export type {
  ExtrinsicWithBoundedEvents,
  CertificateId,
  Application,
  VestingScheduleOf,
  RootCertificate,
  AccountBlockData,
} from "./types";

export * as blockFinalizer from "./blockFinalizer";

export * as services from "./services";

export { CacheService, MetricsService, BalanceService } from "./services";

export * as logger from "./logger";

export * as sslKeys from "./sslKeys";
