import { EntityRepository, Repository } from "typeorm";
import VestingSchedule from "../../models/public/vestingSchedule";

type NewVestingSchedule = {
  accountId: number;
  start: string;
  period: string;
  periodCount: number;
  perPeriod: string;
  blockId: number;
  status: string;
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
    status = "active",
  }: NewVestingSchedule): Promise<VestingSchedule> {
    return this.save({
      accountId,
      start,
      period,
      periodCount,
      perPeriod,
      blockId,
      status,
    });
  }
  public async changeStatus(
    vestingSchedule: VestingSchedule,
    status: string
  ): Promise<VestingSchedule> {
    vestingSchedule.status = status;
    return await this.save(vestingSchedule);
  }
  /* 
  public async cancelSchedules(accountAddress: string): Promise<void> {
    const schedules = await this.find({
      accountAddress: accountAddress,
    });
    for (const schedule of schedules) {
      await this.changeStatus(schedule, "canceled");
    }
  }
  */
  public async removeSchedulesByAccount(accountId: number): Promise<void> {
    const schedules = await this.find({
      account: { accountId: accountId },
    });
    await this.remove(schedules);
  }
}
