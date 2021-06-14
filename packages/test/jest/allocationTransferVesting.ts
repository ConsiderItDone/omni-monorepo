import { expect } from "@jest/globals";
import { getApi } from "@nodle/polkadot/src/api";
import { ACCOUNTS } from "../src/const";
import Tester from "../src/tester";
import { ApiPromise, Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";
import { getLastBalance, getVestingSchedules, sleep, formatSchedule } from "../src/utils";
import { VestingSchedule } from "../src/utils/types";

const keyring = new Keyring({ type: "sr25519" });

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
  afterEach(() => {
    //console.log("Fetching done after ", fetchCount, "requests");})
  });
  let fetchCount = 0;
  async function waitForAfter(before: any, getAfterCallback: any, equalityWrap = (val: any) => val) {
    let after = await getAfterCallback();
    if (equalityWrap(before) === equalityWrap(after)) {
      if (fetchCount >= 5) return after; // returns 'after' value if waiting too long
      fetchCount++
      await sleep(2000);
      after = await waitForAfter(before, getAfterCallback, equalityWrap);
    }
    return after;
  }

  it("Transfer. Balance after transfer should be equal to balance before transfer + transfered amount", async () => {
    const transferValue = getRandomBalanceAmount();

    const freeBefore = await getLastBalance(receiver);

    await tester.transfer(receiver, transferValue); // returns hash => hash.toString()

    await sleep(8000);

    const freeAfter = await waitForAfter(freeBefore, getLastBalance.bind(null, ACCOUNTS.BOB));

    expect(freeAfter).toBe(freeBefore + transferValue);
  });

  it("Allocation. Balance after allocation should be equal to balance before allocation + allocated amount", async () => {
    const allocationValue = getRandomBalanceAmount();

    const freeBefore = await getLastBalance(receiver);

    await tester.allocate(receiver, allocationValue, "0x00"); // returns hash => hash.toString()

    await sleep(8000);

    const freeAfter = await waitForAfter(freeBefore, getLastBalance.bind(null, ACCOUNTS.BOB));

    const allocationValueAfterFee = allocationValue * 0.8;

    expect(freeAfter).toBe(freeBefore + allocationValueAfterFee);
  });

  it("Vesting schedule. Sended schedule should be equal to last from requested schedules", async () => {
    const schedule = getRandomSchedule();

    const before = await getVestingSchedules(receiver);

    await tester.addVestingSchedule(receiver, schedule);

    await sleep(10000);

    const after = await waitForAfter(before, getVestingSchedules.bind(null, receiver), (val) => val?.length);

    const formattedSchedule = formatSchedule(schedule);

    expect(JSON.stringify(after[after.length - 1])).toBe(JSON.stringify(formattedSchedule));
  });
});

export const getRandomBalanceAmount = () => {
  return getRandomInt(1, 10) * 1000000000000;
};

export const getRandomSchedule = (): VestingSchedule => {
  return {
    start: getRandomInt().toString(),
    period: getRandomInt(1, 1000).toString(),
    period_count: getRandomInt(1, 10),
    per_period: (getRandomInt(1, 10) * 1000000000000).toString(),
  };
};

export function getRandomInt(min = 1, max = 10000): number {
  return Math.round(Math.random() * (max - min + 1) + min);
}
