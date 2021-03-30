import { Resolver, Query, Arg, FieldResolver, Root } from "type-graphql";
import Block from "@nodle/db/src/models/public/block";
import Event from "@nodle/db/src/models/public/event";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import Log from "@nodle/db/src/models/public/log";
import RootCertificate from "@nodle/db/src/models/public/rootCertificate";
import VestingSchedule from "@nodle/db/src/models/public/vestingSchedule";

import { createBaseResolver } from "../baseResolver";
import { arrayFieldResolver } from "../fieldsResolver";

const BlockBaseResolver = createBaseResolver("Block", Block);

@Resolver(Block)
export default class BlockResolver extends BlockBaseResolver {
  @Query(() => Block)
  async getBlockByBlockNumber(@Arg("number") number: string): Promise<Block> {
    const block = await Block.findOne({
      number,
    });

    if (block === undefined) {
      throw new Error(`Block #${number} not found`);
    }

    return block;
  }

  @FieldResolver()
  events(@Root() source: Block): Promise<Event[]> {
    return arrayFieldResolver<Block>(source, Event, "blockId");
  }

  @FieldResolver()
  extrinsics(@Root() source: Block): Promise<Extrinsic[]> {
    return arrayFieldResolver<Block>(source, Extrinsic, "blockId");
  }

  @FieldResolver()
  logs(@Root() source: Block): Promise<Log[]> {
    return arrayFieldResolver(source, Log, "blockId");
  }

  @FieldResolver()
  rootCertificates(@Root() source: Block): Promise<RootCertificate[]> {
    return arrayFieldResolver(source, RootCertificate, "blockId");
  }

  @FieldResolver()
  vestingSchedules(@Root() source: Block): Promise<VestingSchedule[]> {
    return arrayFieldResolver(source, VestingSchedule, "blockId");
  }
}
