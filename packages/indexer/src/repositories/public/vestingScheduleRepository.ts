import { EntityRepository, Repository } from "typeorm";
import VestingSchedule from "../../models/public/vestingSchedule";

type NewVestingSchedule = {
    start: string,
    period: string,
    periodCount: number,
    perPeriod: string,
    blockId: number,
};

@EntityRepository(VestingSchedule)
export default class VestingScheduleRepository extends Repository<VestingSchedule> {
  public add({
    start,
    period,
    periodCount,
    perPeriod,
    blockId,
  }: NewVestingSchedule) {
    return this.save({
        start,
        period,
        periodCount,
        perPeriod,
        blockId,
    });
  }
}
