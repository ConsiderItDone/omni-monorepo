import { expect } from "@jest/globals";
import { getApi } from "@nodle/polkadot/src/api";
import Tester from "../src/tester";
import { ApiPromise, Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";
import { mnemonicGenerate } from "@polkadot/util-crypto";
import { getLastRootCertificate, sleep } from "../src/utils";
import { RootCertificate } from "../src/utils/types";

const keyring = new Keyring({ type: "sr25519", ss58Format: 4 });
keyring.setSS58Format(37);

describe("Preparation", () => {
  let api: ApiPromise;
  let tester: Tester;
  let tester2: Tester;
  let receiver: string;
  let before: RootCertificate;
  let after: RootCertificate;
  beforeAll(async () => {
    api = await getApi(process.env.WS_PROVIDER || "ws://3.217.156.114:9944"); //init api

    await waitReady();
    const alice = keyring.addFromUri("//Alice", { name: "Alice default" }); //init wasm-crypto and create keyring
    tester = new Tester(api, alice);
    tester2 = new Tester(api, keyring.addFromUri(mnemonicGenerate()));
    receiver = tester2.sender.address;
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
      fetchCount++;
      await sleep(2000);
      after = await waitForAfter(before, getAfterCallback, equalityWrap);
    }
    return after;
  }

  it("pkiRootOfTrust. Booking Slot", async () => {
    before = await getLastRootCertificate(receiver);

    await tester.bookSlot(receiver);
    await sleep(8000);

    after = await waitForAfter(before, getLastRootCertificate.bind(null, receiver));

    expect(after).toHaveProperty("created");
  });

  it("pkiRootOfTrust. Renewing Slot", async () => {
    await tester.renewSlot(receiver);

    await sleep(8000);

    after = await waitForAfter(before, getLastRootCertificate.bind(null, receiver), (val) => val?.renewed);
    expect(before?.renewed).not.toBe(after?.renewed);
  });

  it("pkiRootOfTrust. Revoking Slot", async () => {
    await tester.revokeSlot(receiver);

    await sleep(8000);

    after = await waitForAfter(before, getLastRootCertificate.bind(null, receiver), (val) => val?.revoked);
    expect(after?.revoked).toBe(true);
  });
});
