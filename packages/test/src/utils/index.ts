import { ApiPromise } from "@polkadot/api";
import { SubmittableExtrinsicFunction } from "@polkadot/api/types";
import type {
  EventRecord,
  Event,
  AccountInfo,
  AccountInfoWithProviders,
} from "@polkadot/types/interfaces/system";
import { ISubmittableResult } from "@polkadot/types/types";
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

export function getExtrinsics(): Extrinsics<
  SubmittableExtrinsicFunction<"promise">
> {
  const api: ApiPromise = this.api;

  const { allocations, balances, pkiTcr, pkiRootOfTrust, vesting } = api.tx;
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
    addVestingSchedule: vesting?.addVestingSchedule,
    cancellAllVestingSchedules: vesting?.cancelAllVestingSchedules,
  };
}

export async function signAndSend(
  fn: SubmittableExtrinsicFunction<"promise">,
  ...args: any[]
): Promise<void> {
  const sender = this.sender;
  const unsub = await fn(...args).signAndSend(
    sender,
    ({ events = [], status }: ISubmittableResult) => {
      if (status.isInBlock) {
        console.log(`Extrinsic included at blockHash ${status.asInBlock}`);
        unsub();
      } else if (status.isFinalized) {
        console.log(`Extrinsic finalized at blockHash ${status.asFinalized}`);
        unsub();
      } else {
        console.log("Status " + status.type);
      }
      /*       events.forEach(({ phase, event: { data, method, section } }) => {
        if (events.some((e) => e.event))
          console.log(
            phase.toString() +
              " : " +
              section +
              "." +
              method +
              " " +
              data.toString()
          );
      }); */
    }
  );
}

function logArgs(func: SubmittableExtrinsicFunction<"promise">) {
  console.log(
    `Arguments for '${func.section}:${func.method}': ${JSON.stringify(
      func.meta.args,
      null,
      2
    )}`
  );
}
