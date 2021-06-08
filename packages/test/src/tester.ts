import { ApiPromise } from "@polkadot/api";
import { Signer, SubmittableExtrinsicFunction } from "@polkadot/api/types";

import { Extrinsics, getExtrinsics, signAndSend } from "./utils";

class Tester {
  sender: any;
  api: ApiPromise;
  extrinsics: Extrinsics<SubmittableExtrinsicFunction<"promise">>;

  getExtrinsics = getExtrinsics.bind(this);
  signAndSend = signAndSend.bind(this);

  constructor(api: ApiPromise, sender: any) {
    this.api = api;
    this.sender = sender;
    this.extrinsics = this.getExtrinsics();
  }

  async changeSender(newSender: string) {
    await this.api.query.system
      .account(newSender)
      .then((data) => {
        data && this.sender === newSender;
        console.log("Sender succesfully changed, new sender -", this.sender);
      })
      .catch((e) => {
        console.log(
          "Received error fetching account :",
          newSender,
          "\nError message:",
          e.message
        );
      });
    return this;
  }

  allocate = (to: string, amount: number, proof: any) =>
    this.signAndSend(this.extrinsics.allocate, to, amount, proof);

  transfer = (dest: string, value: number) =>
    this.signAndSend(this.extrinsics.transfer, dest, value);

  apply = (metadata: any, deposit: number) =>
    this.signAndSend(this.extrinsics.apply, metadata, deposit);

  counter = (member: string, deposit: number) =>
    this.signAndSend(this.extrinsics.counter, member, deposit);

  vote = (member: string, supporting: boolean, deposit: number) =>
    this.signAndSend(this.extrinsics.vote, member, supporting, deposit);

  challenge = (member: string, deposit: number) =>
    this.signAndSend(this.extrinsics.challenge, member, deposit);

  bookSlot = (certificate_id: string) =>
    this.signAndSend(this.extrinsics.bookSlot, certificate_id);

  renewSlot = (certificate_id: string) =>
    this.signAndSend(this.extrinsics.renewSlot, certificate_id);

  revokeSlot = (certificate_id: string) =>
    this.signAndSend(this.extrinsics.revokeSlot, certificate_id);

  revokeChild = (root: string, certificate_id: string) =>
    this.signAndSend(this.extrinsics.revokeChild, root, certificate_id);

  addVestingSchedule = (dest: string, schedule: any) =>
    this.signAndSend(this.extrinsics.addVestingSchedule, dest, schedule);

  cancelAllVestingSchedules = (
    who: string,
    funds_collector: string,
    limit_to_free_balance: boolean
  ) =>
    this.signAndSend(
      this.extrinsics.cancellAllVestingSchedules,
      who,
      funds_collector,
      limit_to_free_balance
    );
}

export default Tester;
