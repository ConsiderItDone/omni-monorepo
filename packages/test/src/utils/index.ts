import { ApiPromise } from "@polkadot/api";
import { SubmittableExtrinsicFunction } from "@polkadot/api/types";
import type { Hash } from "@polkadot/types/interfaces";
import { client } from "../client";
import { queryLastBalance, queryVestingSchedules, queryRootCertificates, queryApplication } from "../queries";
import { VestingSchedule, VestingScheduleFormatted, RootCertificate } from "./types";
export interface Extrinsics<T> {
  allocate: T;
  transfer: T;
  apply: T;
  counter: T;
  vote: T;
  challenge: T;
  bookSlot: T;
  renewSlot: T;
  revokeSlot: T;
  revokeChild: T;
  addVestingSchedule: T;
  cancellAllVestingSchedules: T;
}

export function getExtrinsics(): Extrinsics<SubmittableExtrinsicFunction<"promise">> {
  const api: ApiPromise = this.api;

  const { allocations, balances, pkiTcr, pkiRootOfTrust, grants } = api.tx;
  return {
    allocate: allocations.allocate,
    transfer: balances.transfer,
    apply: pkiTcr.apply,
    counter: pkiTcr.counter,
    vote: pkiTcr.vote,
    challenge: pkiTcr.challenge,
    bookSlot: pkiRootOfTrust.bookSlot,
    renewSlot: pkiRootOfTrust.renewSlot,
    revokeSlot: pkiRootOfTrust.revokeSlot,
    revokeChild: pkiRootOfTrust.revokeChild,
    addVestingSchedule: grants?.addVestingSchedule,
    cancellAllVestingSchedules: grants?.cancelAllVestingSchedules,
  };
}

export async function signAndSend(fn: SubmittableExtrinsicFunction<"promise">, ...args: any[]): Promise<Hash> {
  const sender = this.sender;
  return await fn(...args).signAndSend(sender);
}

export const getLastBalance = async (address: string): Promise<number> => {
  const { balanceByAddress } = await client.request(queryLastBalance, { address });
  return Number(balanceByAddress?.free) || null;
};

export const getVestingSchedules = async (address: string): Promise<VestingScheduleFormatted[]> => {
  const { accountByAddress } = await client.request(queryVestingSchedules, { address });
  return accountByAddress?.vestingSchedules || [];
};

export const getLastRootCertificate = async (address: string): Promise<RootCertificate> => {
  const { accountByAddress } = await client.request(queryRootCertificates, { address });
  if (!accountByAddress) return null;
  const { rootCertificatesByKey } = accountByAddress;
  return rootCertificatesByKey?.length && rootCertificatesByKey[rootCertificatesByKey.length - 1];
};

export interface Application {
  status: string;
  votes: {
    isSupported: boolean;
    initiator: { address: string };
  }[];
}

export const getApplication = async (address: string): Promise<Application> => {
  const { accountByAddress } = await client.request(queryApplication, { address });

  if (!accountByAddress) return { status: "404", votes: [] };
  const { applicationsByCandidate } = accountByAddress;
  return (
    (applicationsByCandidate[applicationsByCandidate.length - 1] as Application) ||
    ({ status: "", votes: [] } as Application)
  );
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const formatSchedule = (schedule: VestingSchedule): VestingScheduleFormatted => {
  return {
    start: schedule.start.toString(),
    period: schedule.period.toString(),
    periodCount: schedule.period_count, //number
    perPeriod: schedule.per_period.toString(),
  };
};
