// import { cacheService } from "@nodle/utils/services/cacheService";
import { BalanceRepository, Balance } from "@nodle/db/index";
import { getConnection } from "typeorm";

export class BalanceService {
  public async getBalanceByAddress(address: string): Promise<Balance> {
    // const cachedBalance = await cacheService.get(address).then(JSON.parse);

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
