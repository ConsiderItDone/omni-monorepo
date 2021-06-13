import { expect } from "@jest/globals";
import { getApi } from "@nodle/polkadot/src/api";
import { ACCOUNTS } from "../src/const";
import Tester from "../src/tester";
import { ApiPromise, Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";
import { getLastBalance, getLastRootCertificate, sleep, formatSchedule } from "../src/utils";
import { RootCertificate, VestingSchedule } from "../src/utils/types";
import { client } from "../src/client";
import { queryTransfer, queryVestingSchedules } from "../src/queries";

const keyring = new Keyring({ type: "sr25519" });

describe("Preparation", () => {
  let tester: Tester;
  let api: ApiPromise;
  const receiver = ACCOUNTS.CHARLIE;
  let before: RootCertificate;
  let after: RootCertificate;
  beforeAll(async () => {
    api = await getApi(process.env.WS_PROVIDER || "ws://3.217.156.114:9944"); //init api

    waitReady().then(() => {
      const alice = keyring.addFromUri("//Alice", { name: "Alice default" }); //init wasm-crypto and create keyring
      tester = new Tester(api, alice);
    });
    before = await getLastRootCertificate(receiver);
  });
  beforeEach(() => {
    fetchCount = 0;
  });
  afterEach(() => {
    //console.log("Fetching done after ", fetchCount, "requests");})
    before = after;
  });
  let fetchCount = 0;
  async function waitForAfter(before: any, getAfterCallback: any, equalityWrap = (val: any) => val) {
    let after = await getAfterCallback();
    if (equalityWrap(before) === equalityWrap(after)) {
      if (fetchCount >= 5) return after; // returns 'after' value if waiting too long
      await sleep(2000);
      after = await waitForAfter(before, getAfterCallback, equalityWrap);
    }
    return after;
  }
  async function getAfter(equalityWrap = (val: any) => val) {
    return waitForAfter.bind(null, before, getLastRootCertificate.bind(null, receiver), equalityWrap);
  }

  it("Application. Booking Slot", async () => {
    await tester.bookSlot(receiver);
    await sleep(8000);

    after = await getAfter();

    expect(after).toHaveProperty("created");
  });

  it("Application. Renewing Slot", async () => {
    await tester.renewSlot(receiver);

    await sleep(8000);

    after = await getAfter((val) => val?.renewed);
    expect(before?.renewed).not.toBe(after?.renewed);
  });

  it("Application. Revoking Slot", async () => {
    await tester.revokeSlot(receiver);

    await sleep(8000);

    after = await getAfter((val) => val?.revoked);
    expect(after?.revoked).toBe(true);
  });
});
