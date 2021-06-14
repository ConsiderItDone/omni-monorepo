import { expect } from "@jest/globals";
import { getApi } from "@nodle/polkadot/src/api";
import { ACCOUNTS } from "../src/const";
import Tester from "../src/tester";
import { ApiPromise, Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";
import { getLastBalance, getLastRootCertificate, sleep, formatSchedule, getApplication } from "../src/utils";
import { mnemonicGenerate } from "@polkadot/util-crypto";
import { RootCertificate, VestingSchedule } from "../src/utils/types";
import { client } from "../src/client";
import { queryTransfer, queryVestingSchedules } from "../src/queries";

jest.setTimeout(120000);

const keyring = new Keyring({ type: "sr25519", ss58Format: 4 });
keyring.setSS58Format(37);

describe("Preparation", () => {
  let tester: Tester;
  let tester2: Tester;
  let api: ApiPromise;
  let store = { challengedAcc: "" };

  beforeAll(async () => {
    api = await getApi(process.env.WS_PROVIDER || "ws://3.217.156.114:9944"); //init api
    await waitReady();
    const alice = keyring.addFromUri("//Alice", { name: "Alice default" }); //init wasm-crypto and create keyring

    tester = new Tester(api, alice);
    tester2 = await initTester();
    await sleep(6000); //wait for allocation to apply
  });
  beforeEach(async () => {
    fetchCount = 0;
  });

  const initTester = async () => {
    const newTester = new Tester(api, keyring.addFromUri(mnemonicGenerate()));
    await tester.allocate(newTester.sender.address, 15 * 1000000000000, "0x00");
    await sleep(2000); //wait for allocation to apply
    return newTester;
  };

  let fetchCount = 0;
  async function waitForAfter(before: any, getAfterCallback: any, equalityWrap = (val: any) => val) {
    let after = await getAfterCallback();
    /*     console.log("before", before);
    console.log("after", after); */
    if (equalityWrap(before) === equalityWrap(after)) {
      if (fetchCount >= 5) return after; // returns 'after' value if waiting too long
      fetchCount++;
      await sleep(2000);
      after = await waitForAfter(before, getAfterCallback, equalityWrap);
    }
    return after;
  }

  /*   it("Application. Apply", async () => {
    await tester2.apply("0x00", 10 * 1000000000000);
    await sleep(8000);

    const application = await waitForAfter(
      { status: "" },
      getApplication.bind(null, tester2.sender.address),
      (val) => val?.status
    );
    expect(application).toHaveProperty("status", "application");
  });

  it("Application. Counter", async () => {
    await tester.counter(tester2.sender.address, 10 * 1000000000000);
    await sleep(8000);

    const before = await getApplication(tester2.sender.address);
    const application = await waitForAfter(
      before,
      getApplication.bind(null, tester2.sender.address),
      (val) => val?.status
    );
    expect(application).toHaveProperty("status", "countered");
  }); */

  it("Application. Challenge", async () => {
    tester2 = await initTester();

    const accountToChallenge = tester2.sender.address;
    const getAppCb = getApplication.bind(null, accountToChallenge);

    store.challengedAcc = accountToChallenge;

    await tester2.apply("0x00", 10 * 1000000000000);

    await sleep(65000); // wait for application to pass
    const before = await waitForAfter({ status: "" }, getAppCb, (val) => val?.status);

    await tester.challenge(tester2.sender.address, 100 * 1000000000000); //100 NODL to challenge
    await sleep(8000);

    const afterChallenge = await waitForAfter(before, getAppCb, (val) => val?.status);

    expect(afterChallenge).toHaveProperty("status", "challenged");
  });

  /*   it("Application. Vote", async () => {
    const candidateAddress = store.challengedAcc;
    const voter = await initTester();

    const applicationBefore = await getApplication(candidateAddress);
    await voter.vote(candidateAddress, true, 1 * 1000000000000);
    await sleep(8000);

    const applicationAfter = await waitForAfter(applicationBefore, getApplication.bind(null, candidateAddress), val=>val?.));

  }); */
});
