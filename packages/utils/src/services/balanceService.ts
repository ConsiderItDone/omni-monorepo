import { BalanceRepository, Balance } from "@omni/db";
import { getConnection } from "typeorm";
import { CacheService } from "./cacheService";
const cacheService = new CacheService();

export class BalanceService {
  public async getBalanceByAddress(address: string): Promise<Balance> {
    console.time(`balance-cache-${address}`);
    const cachedBalance = await cacheService.get(address).then(JSON.parse);
    console.timeEnd(`balance-cache-${address}`);

    if (cachedBalance && JSON.stringify(cachedBalance) !== "{}") {
      console.log(`Found balance in cache by key: ${address} `);
      return cachedBalance;
    }

    const balanceRepository: BalanceRepository = getConnection().getCustomRepository(BalanceRepository);

    const balance = await balanceRepository.getBalanceByAddress(address);

    if (balance) {
      cacheService.set(address, balance);
    }

    return balance || ({} as any); // eslint-disable-line
  }
}
