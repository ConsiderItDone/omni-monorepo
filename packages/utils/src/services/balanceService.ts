import { cacheService } from "@nodle/utils/src/services/cacheService";
import BalanceRepository from "@nodle/db/src/repositories/public/balanceRepository";
import { getConnection } from "typeorm";
import Balance from "@nodle/db/src/models/public/balance";

export class BalanceService {
  public async getBalanceByAddress(address: string): Promise<Balance> {
    const cachedBalance = await cacheService.get(address).then(JSON.parse);

    if (cachedBalance) {
      console.log(`Found balance in cache by key: ${address} `);
      return cachedBalance;
    }

    const balanceRepository = getConnection().getCustomRepository(BalanceRepository);

    const balance = await balanceRepository.getBalanceByAddress(address);

    if (balance) {
      cacheService.set(address, balance);
    }

    return balance || ({} as any); // eslint-disable-line
  }
}
