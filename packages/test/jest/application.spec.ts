import { expect } from "@jest/globals";
import { getApi } from "@nodle/polkadot/src/api";
import Tester from "../src/tester";
import { ApiPromise, Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";
import { sleep, getApplication } from "../src/utils";
import { mnemonicGenerate } from "@polkadot/util-crypto";

jest.setTimeout(230000);

const keyring = new Keyring({ type: "sr25519", ss58Format: 4 });
keyring.setSS58Format(37);

describe("Preparation", () => {
  let tester: Tester;
  let tester2: Tester;
  let tester3: Tester;
  let api: ApiPromise;
  const store = { challengedAcc: "" };

  beforeAll(async () => {
    api = await getApi(process.env.WS_PROVIDER || "ws://3.217.156.114:9944"); //init api
    await waitReady();
    const alice = keyring.addFromUri("//Alice", { name: "Alice default" }); //init wasm-crypto and create keyring

    tester = new Tester(api, alice);
    tester2 = await initTester();
    await sleep(6000); //wait for allocation to apply
  });
  beforeEach(() => {
    fetchCount = 0;
  });

  const initTester = async (allocationAmount = 20) => {
    const newTester = new Tester(api, keyring.addFromUri(mnemonicGenerate()));
    await tester.allocate(newTester.sender.address, allocationAmount * 1000000000000, "0x00");
    await sleep(6000); //wait for allocation to apply
    return newTester;
  };

  let fetchCount = 0;
  async function waitForAfter<T = any>(before: T, getAfterCallback: any, equalityWrap = (val: any) => val) {
    let after: T = await getAfterCallback();
    if (equalityWrap(before) === equalityWrap(after)) {
      if (fetchCount >= 5) return after; // returns 'after' value if waiting too long
      fetchCount++;
      await sleep(2000);
      after = await waitForAfter(before, getAfterCallback, equalityWrap);
    }
    return after;
  }

  it("Application. Apply", async () => {
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
  });
  it("Application. Challenge", async () => {
    tester2 = await initTester();

    const accountToChallenge = tester2.sender.address;
    const getAppCb = getApplication.bind(null, accountToChallenge);

    store.challengedAcc = accountToChallenge;

    await tester2.apply("0x00", 10 * 1000000000000); // For challenge Accepted

    await sleep(70000); // wait for applications to pass
    const before = await waitForAfter({ status: "", votes: [] }, getAppCb, (val) => val?.status);

    await tester.challenge(accountToChallenge, 100 * 1000000000000); //100 NODL to challenge

    await sleep(8000);

    const afterChallenge = await waitForAfter(before, getAppCb, (val) => val?.status);

    expect(afterChallenge).toHaveProperty("status", "challenged");
  });
  it("Application. Vote for", async () => {
    const candidateAddress = store.challengedAcc;
    const voter = await initTester(180);

    const applicationBefore = await getApplication(candidateAddress);

    await voter.vote(candidateAddress, true, 110 * 1000000000000); // 110 NODL to beat challenger deposit so challenged account would win
    await sleep(8000);

    const after = await waitForAfter(applicationBefore, getApplication.bind(null, candidateAddress), (val) =>
      JSON.stringify(val)
    );
    const voteRecorded = after?.votes.some(
      (v) => v?.initiator?.address === voter.sender.address && v?.isSupported === true
    );
    expect(voteRecorded).toBe(true);
  });
  it("Application. Accepted", async () => {
    await sleep(100000);
    const application = await waitForAfter(
      { status: "challenged", votes: [] },
      getApplication.bind(null, tester2.sender.address),
      (val) => val?.status
    );
    expect(application.status).toBe("member");
  });
  it("Application. Challenge Refused", async () => {
    tester3 = await initTester();

    await sleep(2000);
    await tester3.apply("0x00", 10 * 1000000000000); // For challenge Refused

    await sleep(65000);
    await tester.challenge(tester3.sender.address, 100 * 1000000000000); //100 NODL to challenge

    await sleep(150000);
    const application = await waitForAfter(
      { status: "challenged", votes: [] },
      getApplication.bind(null, tester3.sender.address),
      (val) => val?.status
    );
    expect(application.status).toBe("refused");
  });
});
