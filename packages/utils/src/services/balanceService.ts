// import { cacheService } from "@nodle/utils/services/cacheService";
import { BalanceRepository, Balance } from "@nodle/db";
import { getConnection } from "typeorm";

export class BalanceService {
  public async getBalanceByAddress(address: string): Promise<Balance> {
    // console.time("balance");
    // const cachedBalance = await cacheService.get(address).then(JSON.parse);
    // console.timeEnd("balance");

    // if (cachedBalance) {
    //   console.log(`Found balance in cache by key: ${address} `);
    //   return cachedBalance;
    // }

    const balanceRepository = getConnection().getCustomRepository(BalanceRepository);

    const balance = await balanceRepository.getBalanceByAddress(address);

    // if (balance) {
    //   cacheService.set(address, balance);
    // }

    return balance || ({} as any); // eslint-disable-line
  }
}
