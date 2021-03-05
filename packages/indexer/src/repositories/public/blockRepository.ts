import { EntityRepository, Repository } from "typeorm";
import Block from "../../models/public/block";

@EntityRepository(Block)
export default class BlockRepository extends Repository<Block> {
  public add({ // TODO: support all fields
    number
  }: {
    number: number;
  }) {
    return this.save({
      number,
    });
  }
}
