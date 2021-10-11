import { ACCOUNTS } from "@nodle/test/src/const";
import Tester from "@nodle/test/src/tester";

export const submitTransfers = async (
  tester: Tester,
  transferQuantity: number,
  options = { receiver: ACCOUNTS.BOB, amount: 1000000000000 }
) => {
  try {
    for (let i = 0; i < transferQuantity; i++) {
      const resultHash = await tester.transfer(options.receiver, options.amount);
      console.log(i, resultHash.toString())
    }
  } catch (e) {
    console.error(e);
  }
};

export const submitAllocations = async (
  tester: Tester,
  transferQuantity: number,
  options = { receiver: ACCOUNTS.BOB, amount: 1000000000000 }
) => {
  try {
    for (let i = 0; i < transferQuantity; i++) {
      const resultHash = await tester.allocate(options.receiver, options.amount, "0x00");
      console.log(i, resultHash.toString())
    }
  } catch (e) {
    console.error(e);
  }
};
