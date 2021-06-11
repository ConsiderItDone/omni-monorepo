import { expect } from "@jest/globals";
import { getApi } from "@nodle/polkadot/src/api";
import { ACCOUNTS } from "../src/const";
import Tester from "../src/tester";
import { ApiPromise, Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";
import { getLastBalance, getVestingSchedules, sleep, formatSchedule } from "../src/utils";
import { VestingSchedule } from "../src/utils/types";
import { client } from "../src/client";
import { queryTransfer, queryVestingSchedules } from "../src/queries";

const keyring = new Keyring({ type: "sr25519" });
``;
describe("Preparation", () => {
  let tester: Tester;
  let api: ApiPromise;
  const receiver = ACCOUNTS.BOB;
  beforeAll(async () => {
    api = await getApi(process.env.WS_PROVIDER || "ws://3.217.156.114:9944"); //init api

    waitReady().then(() => {
      const alice = keyring.addFromUri("//Alice", { name: "Alice default" }); //init wasm-crypto and create keyring
      tester = new Tester(api, alice);
    });
  });
  beforeEach(() => {
    fetchCount = 0;
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

  it("Transfer. Balance after transfer should be equal to balance before transfer + transfered amount", async () => {
    const transferValue = 1010000000000;

    const freeBefore = await getLastBalance(receiver);

    await tester.transfer(receiver, transferValue); // returns hash => hash.toString()

    await sleep(8000);

    const freeAfter = await waitForAfter(freeBefore, getLastBalance.bind(null, ACCOUNTS.BOB));

    //console.log("Balance difference after ", fetchCount, "requests");

    expect(freeAfter).toBe(freeBefore + transferValue);
  });

  it("Allocation. Balance after allocation should be equal to balance before allocation + allocated amount", async () => {
    const allocationValue = 1100000000000;
    const receiver = ACCOUNTS.BOB;

    const freeBefore = await getLastBalance(receiver);

    await tester.allocate(receiver, allocationValue, "0x00"); // returns hash => hash.toString()

    await sleep(8000);

    const freeAfter = await waitForAfter(freeBefore, getLastBalance.bind(null, ACCOUNTS.BOB));

    //console.log("Balance difference after ", fetchCount, "requests");

    const allocationValueAfterFee = allocationValue * 0.8;

    expect(freeAfter).toBe(freeBefore + allocationValueAfterFee);
  });

  it("Vesting schedule. Sended schedule should be equal to last from requested schedules", async () => {
    const schedule: VestingSchedule = {
      start: "1200",
      period: "121",
      period_count: 10,
      per_period: "1",
    };

    const before = await getVestingSchedules(receiver);

    await tester.addVestingSchedule(receiver, schedule);

    await sleep(10000);

    const after = await waitForAfter(before, getVestingSchedules.bind(null, receiver), (val) => val?.length);

    //console.log("Vestings difference after ", fetchCount, "requests");

    const formattedSchedule = formatSchedule(schedule);

    expect(JSON.stringify(after[after.length - 1])).toBe(JSON.stringify(formattedSchedule));
  });
});
