import { EntityRepository, Repository, UpdateResult } from "typeorm";
import BackfillProgress from "../../models/public/backfillProgress";

@EntityRepository(BackfillProgress)
export default class BackfillerRepository extends Repository<BackfillProgress> {
  public async init() {
    return this.save({ lastBlockNumber: "0" });
  }
  public async getProgress(): Promise<number> {
    const progress = await this.findOne(1);
    return progress.lastBlockNumber ? parseInt(progress.lastBlockNumber) : 0;
  }
  public async updateProgress(
    lastSyncedBlockNumber: number
  ): Promise<UpdateResult> {
    return await this.update(1, {
      lastBlockNumber: lastSyncedBlockNumber.toString(),
    });
  }
}
