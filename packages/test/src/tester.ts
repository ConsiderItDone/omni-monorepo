import { ApiPromise } from "@polkadot/api";
import { SubmittableExtrinsicFunction } from "@polkadot/api/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import { Extrinsics, getExtrinsics, signAndSend } from "./utils";
import type { Hash } from "@polkadot/types/interfaces";

class Tester {
  sender: KeyringPair;
  api: ApiPromise;
  extrinsics: Extrinsics<SubmittableExtrinsicFunction<"promise">>;

  getExtrinsics = getExtrinsics.bind(this);
  //eslint-disable-next-line
  signAndSend: (fn: SubmittableExtrinsicFunction<"promise">, ...args: any[]) => Promise<Hash> = signAndSend.bind(this);

  constructor(api: ApiPromise, sender: KeyringPair) {
    this.api = api;
    this.sender = sender;
    this.extrinsics = this.getExtrinsics();
  }
  changeSender = (newSender: KeyringPair): void => {
    this.sender = newSender;
  };

  allocate = (to: string, amount: number, proof: string): Promise<Hash> =>
    this.signAndSend(this.extrinsics.allocate, to, amount, proof);

  transfer = (dest: string, value: number): Promise<Hash> => this.signAndSend(this.extrinsics.transfer, dest, value);

  //eslint-disable-next-line
  apply = (metadata: any, deposit: number): Promise<Hash> => this.signAndSend(this.extrinsics.apply, metadata, deposit);

  counter = (member: string, deposit: number): Promise<Hash> =>
    this.signAndSend(this.extrinsics.counter, member, deposit);

  vote = (member: string, supporting: boolean, deposit: number): Promise<Hash> =>
    this.signAndSend(this.extrinsics.vote, member, supporting, deposit);

  challenge = (member: string, deposit: number): Promise<Hash> =>
    this.signAndSend(this.extrinsics.challenge, member, deposit);

  bookSlot = (certificate_id: string): Promise<Hash> => this.signAndSend(this.extrinsics.bookSlot, certificate_id);

  renewSlot = (certificate_id: string): Promise<Hash> => this.signAndSend(this.extrinsics.renewSlot, certificate_id);

  revokeSlot = (certificate_id: string): Promise<Hash> => this.signAndSend(this.extrinsics.revokeSlot, certificate_id);

  revokeChild = (root: string, certificate_id: string): Promise<Hash> =>
    this.signAndSend(this.extrinsics.revokeChild, root, certificate_id);

  //eslint-disable-next-line
  addVestingSchedule = (dest: string, schedule: any): Promise<Hash> =>
    this.signAndSend(this.extrinsics.addVestingSchedule, dest, schedule);

  cancelAllVestingSchedules = (who: string, funds_collector: string, limit_to_free_balance: boolean): Promise<Hash> =>
    this.signAndSend(this.extrinsics.cancellAllVestingSchedules, who, funds_collector, limit_to_free_balance);
}

export default Tester;
