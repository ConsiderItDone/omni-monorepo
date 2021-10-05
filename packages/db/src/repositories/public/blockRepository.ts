import { EntityRepository, Repository, LessThanOrEqual, UpdateResult } from "typeorm";
import Block from "../../models/public/block";

@EntityRepository(Block)
export default class BlockRepository extends Repository<Block> {
  public async add({
    number,
    timestamp,
    hash,
    parentHash,
    stateRoot,
    extrinsicsRoot,
    specVersion,
    finalized,
  }: {
    number: string;
    timestamp: Date;
    hash: string;
    parentHash: string;
    stateRoot: string;
    extrinsicsRoot: string;
    specVersion: number;
    finalized: boolean;
  }): Promise<Block> {
    const q = await this.createQueryBuilder()
      .insert()
      .into(Block)
      .values({
        number,
        timestamp,
        hash,
        parentHash,
        stateRoot,
        extrinsicsRoot,
        specVersion,
        finalized,
      })
      .onConflict(`("number") DO NOTHING`)
      .returning([
        "number",
        "block_id",
        "timestamp",
        "hash",
        "parent_hash",
        "state_root",
        "extrinsics_root",
        "spec_version",
        "finalized",
      ])
      .execute();
    return q.generatedMaps[0] as Block;

    /* const block = await this.save({
      number,
      timestamp,
      hash,
      parentHash,
      stateRoot,
      extrinsicsRoot,
      specVersion,
      finalized,
    });

    console.log("block", block);
    return block; */
  }

  public findByNumber(number: number): Promise<Block> {
    return this.findOne({ where: { number } });
  }

  public finalizeBlocks(lastFinalizedBlockNumber: number): Promise<UpdateResult> {
    return this.update(
      {
        finalized: false,
        number: LessThanOrEqual(lastFinalizedBlockNumber),
      },
      {
        finalized: true,
      }
    );
  }

  public async deleteByBlockId(blockId: number) {
    return this.delete({ blockId });
  }
}
