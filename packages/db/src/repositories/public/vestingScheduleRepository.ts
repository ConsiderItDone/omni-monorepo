import { EntityRepository, Repository } from "typeorm";
import VestingSchedule from "../../models/public/VestingSchedule";

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
}
