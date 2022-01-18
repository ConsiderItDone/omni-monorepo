const getCurrentDate = (): Date => new Date();
const lowerCaseFirstLetter = (string = ""): string => {
  return string.charAt(0).toLowerCase() + string.slice(1);
};

export const Utils = {
  getCurrentDate,
  lowerCaseFirstLetter,
};

export * as MQ from "./mq";

export * as types from "./types";

export * as blockFinalizer from "./blockFinalizer";

export * as services from "./services";
