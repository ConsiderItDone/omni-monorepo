import * as winston from "winston";

export default class Logger {
  private client: winston.Logger;
  constructor() {
    this.client = winston.createLogger({
      format: winston.format.json(),
      transports: new winston.transports.Console(),
    });
  }
  // eslint-disable-next-line
  public info(message: string, data?: any): void {
    this.client.info(message, data);
  }
  // eslint-disable-next-line
  public warn(message: string, data?: any): void {
    this.client.warn(message, data);
  }
  // eslint-disable-next-line
  public error(message: string, data?: any): void {
    this.client.error(message, data);
  }
}

export const logger = new Logger();

type savedDataParams = {
  length?: number;
  savedLength?: number;
  blockNumber?: number;
  blockId?: number;
};

function getReceivedString(type: string, length: number, blockNumber: number) {
  switch (type) {
    case "block":
      return `Received block with number ${blockNumber}`;
    default:
      return `Received ${length} ${type} for block №: ${blockNumber}`;
  }
}
function getCustomEventReceivedString(type: string, blockNumber: number) {
  switch (type) {
    default:
      return `Received ${type} event in block №: ${blockNumber}`;
  }
}

function getSavedString(type: string, params: savedDataParams): string {
  const { length, savedLength, blockNumber, blockId } = params;
  switch (type) {
    case "block":
      return `Block number ${blockNumber} saved succesfully at block_id: ${blockId}`;
    default:
      return `Successfully saved ${savedLength}/${length} ${type} of block №: ${blockNumber} at block_id: ${blockId}`;
  }
}

export const LOGGER_INFO_CONST = {
  BLOCK_RECEIVED: (blockNumber: number): string => getReceivedString("block", null, blockNumber),
  BLOCK_SAVED: (params: savedDataParams): string => getSavedString("block", params),
  BLOCK_DUPLICATE: (params: savedDataParams): string => `Block №: ${params.blockNumber} already in DB, skipping`,
  REORG_CHECK: (blockNumber: number): string => `Checking reorg for Block №: ${blockNumber}`,
  REORG: (blockNumber: number, oldHash: string, newHash: string): string =>
    `Reorg for Block №: ${blockNumber}. Existing hash: ${oldHash} new hash ${newHash}`,
  REORG_WARNING: (blockNumber: number): string =>
    `Could not reorg Block №: ${blockNumber} because it is finalized already`,

  EVENTS_RECEIVED: (length: number, blockNumber: number): string => getReceivedString("events", length, blockNumber),
  EVENTS_SAVED: (params: savedDataParams): string => getSavedString("events", params),

  LOGS_RECEIVED: (length: number, blockNumber: number): string => getReceivedString("logs", length, blockNumber),
  LOGS_SAVED: (params: savedDataParams): string => getSavedString("logs", params),

  EXTRINSICS_RECEIVED: (length: number, blockNumber: number): string =>
    getReceivedString("extrinsics", length, blockNumber),
  EXTRINSICS_SAVED: (params: savedDataParams): string => getSavedString("extrinsics", params),

  CUSTOM_EVENTS_RECEIVED: (length: number, blockNumber: number): string =>
    getReceivedString("tracked events", length, blockNumber),

  ROOT_OF_TRUST_RECEIVED: (blockNumber: number): string => getCustomEventReceivedString("root of trust", blockNumber),
};

const saveErrorPrefix = "Received error saving";
const fetchingErrorPrefix = "Received error fetching";
export const LOGGER_ERROR_CONST = {
  BLOCK_SAVE_ERROR: (blockNumber: number): string => `${saveErrorPrefix} block №: ${blockNumber}`,
  EVENT_SAVE_ERROR: (event: string, blockNumber: number): string =>
    `${saveErrorPrefix} event ${event} at block № ${blockNumber}`,
  LOGS_SAVE_ERROR: (blockNumber: number): string => `${saveErrorPrefix} logs at block №: ${blockNumber}`,
  EXTRINSICS_SAVE_ERROR: (blockNumber: number): string => `${saveErrorPrefix} extrinsics at block №: ${blockNumber}`,

  ROOT_CERTIFICATE_FETCH_ERROR: (certificateId: string): string =>
    `${fetchingErrorPrefix} root certificate for ${certificateId}`,
  ROOT_CERTIFICATE_UPSERT_ERROR: (blockNumber: number): string =>
    `${saveErrorPrefix} root certificate at block №: ${blockNumber}`,

  VESTING_SCHEDULE_SAVE_ERROR: (accountAddress: string, blockNumber: number): string =>
    `${saveErrorPrefix} vesting schedule for ${accountAddress} at block № ${blockNumber}`,
  VESTING_SCHEDULE_FETCH_ERROR: (accountAddress: string, blockNumber: number): string =>
    `${fetchingErrorPrefix} vesting schedules for ${accountAddress} at block №: ${blockNumber} `,

  APPLICATION_FETCH_ERROR: (fetchMethod: string, accoundAddress: string, blockNumber: number): string =>
    `${fetchingErrorPrefix} application for account '${accoundAddress}' with method 'api.query.pkiTcr.${fetchMethod}' at block №: ${blockNumber}`,
  APPLICATION_UPSERT_ERROR: (accountAddress: string, blockNumber: number): string =>
    `${saveErrorPrefix} applicatin for ${accountAddress} at block № ${blockNumber}`,

  ACCOUNT_FETCH_ERROR: (accountAddress: string, blockNumber: number): string =>
    `${fetchingErrorPrefix} account '${accountAddress}' at block №: ${blockNumber}`,
  ACCOUNT_SAVE_ERROR: (blockNumber: number): string => `${saveErrorPrefix} one of accounts at block № ${blockNumber}`,
};
