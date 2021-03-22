import { EntityRepository, Repository } from "typeorm";
import VestingSchedule from "../../models/public/vestingSchedule";

type NewVestingSchedule = {
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
    start,
    period,
    periodCount,
    perPeriod,
    blockId,
  }: NewVestingSchedule): Promise<VestingSchedule> {
    return this.save({
      start,
      period,
      periodCount,
      perPeriod,
      blockId,
    });
  }
}
