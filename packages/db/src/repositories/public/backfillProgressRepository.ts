import { EntityRepository, Repository, UpdateResult } from "typeorm";
import BackfillProgress from "../../models/public/backfillProgress";

const progressDefaults = {
  backfillProgressId: 1,
  lastBlockNumber: "0",
  perPage: 1000,
};
@EntityRepository(BackfillProgress)
export default class BackfillProgressRepository extends Repository<BackfillProgress> {
  public async init(): Promise<BackfillProgress> {
    return await this.save(progressDefaults);
  }
  public async getProgress(): Promise<BackfillProgress> {
    return (await this.findOne(1)) || (await this.init());
  }
  public async getLastBlockNumber(): Promise<number> {
    const progress = await this.getProgress();
    return parseInt(progress.lastBlockNumber);
  }
  public async updateProgress(
    lastSyncedBlockNumber: string
  ): Promise<UpdateResult> {
    return await this.update(1, {
      lastBlockNumber: lastSyncedBlockNumber,
    });
  }
}
