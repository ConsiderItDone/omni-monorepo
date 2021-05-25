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
  @Query(() => Block, { nullable: true })
  async blockByBlockNumber(
    @Arg("number") number: string
  ): Promise<Block | null> {
    try {
      if (BigInt(number) > Number.MAX_SAFE_INTEGER) {
        // wrong number
        return null;
      }
    } catch (e) {
      // not a number
      return null;
    }
    const block = await Block.findOne({
      number,
    });

    return block;
  }
  @Query(() => Block, { nullable: true })
  async blockByHash(@Arg("hash") hash: string): Promise<Block | null> {
    const block = await Block.findOne({
      hash,
    });

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
