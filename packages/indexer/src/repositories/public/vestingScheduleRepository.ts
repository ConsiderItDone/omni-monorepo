import { EntityRepository, Repository } from "typeorm";
import VestingSchedule from "../../models/public/vestingSchedule";

type NewVestingSchedule = {
  accountAddress: string;
  start: string;
  period: string;
  periodCount: number;
  perPeriod: string;
  blockId: number;
  // accoundId: number; Not id
};

@EntityRepository(VestingSchedule)
export default class VestingScheduleRepository extends Repository<VestingSchedule> {
  public add({
    accountAddress,
    start,
    period,
    periodCount,
    perPeriod,
    blockId,
  }: NewVestingSchedule): Promise<VestingSchedule> {
    return this.save({
      accountAddress,
      start,
      period,
      periodCount,
      perPeriod,
      blockId,
    });
  }
  public async changeStatus(
    vestingSchedule: VestingSchedule,
    status: string
  ): Promise<VestingSchedule> {
    vestingSchedule.status = status;
    return await this.save(vestingSchedule);
  }
  public async cancelSchedules(accountAddress: string): Promise<void> {
    const schedules = await this.find({
      accountAddress: accountAddress,
    });
    console.log(schedules)
    for (const schedule of schedules) {
      await this.changeStatus(schedule, "canceled");
    }
  }
}
