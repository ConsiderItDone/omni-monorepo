import { EntityRepository, Repository } from "typeorm";
import VestingSchedule from "../../models/public/vestingSchedule";

type NewVestingSchedule = {
  accountId: number;
  start: string;
  period: string;
  periodCount: number;
  perPeriod: string;
  blockId: number;
};

@EntityRepository(VestingSchedule)
export default class VestingScheduleRepository extends Repository<VestingSchedule> {
  public add({
    accountId,
    start,
    period,
    periodCount,
    perPeriod,
    blockId,
  }: NewVestingSchedule): Promise<VestingSchedule> {
    return this.save({
      accountId,
      start,
      period,
      periodCount,
      perPeriod,
      blockId,
    });
  }
  public async removeSchedulesByAccount(accountId: number): Promise<void> {
    const schedules = await this.find({
      account: { accountId: accountId },
    });
    await this.remove(schedules);
  }
}
