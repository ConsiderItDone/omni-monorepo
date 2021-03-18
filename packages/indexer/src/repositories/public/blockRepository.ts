import { EntityRepository, Repository } from "typeorm";
import Block from "../../models/public/block";
import MQ from "../../mq";

@EntityRepository(Block)
export default class BlockRepository extends Repository<Block> {
  public async add({
    // TODO: support all fields
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
    const block = await this.save({
      number,
      timestamp,
      hash,
      parentHash,
      stateRoot,
      extrinsicsRoot,
      specVersion,
      finalized,
    });

    MQ.getMQ().emit("newBlock", block);

    return block;
  }

  public findByNumber(number: number): Promise<Block> {
    return this.findOne({ where: { number } });
  }
}
