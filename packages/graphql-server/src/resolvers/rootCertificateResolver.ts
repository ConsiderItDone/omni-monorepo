import {
  Resolver,
  Query,
  Arg,
  FieldResolver,
  Root,
  Subscription,
} from "type-graphql";
import RootCertificate from "@nodle/db/src/models/public/rootCertificate";
import Block from "@nodle/db/src/models/public/block";
import MQ from "@nodle/utils/src/mq";

@Resolver(RootCertificate)
export default class RootCertificateResolver {
  @Query(() => RootCertificate)
  async rootCertificate(@Arg("id") id: number): Promise<RootCertificate> {
    const rc = await RootCertificate.findOne(id);
    if (rc === undefined) {
      throw new Error(`RootCertificate ${id} not found`);
    }

    return rc;
  }

  @Query(() => [RootCertificate])
  protected rootCertificates(): Promise<RootCertificate[]> {
    return RootCertificate.find(); // TODO: use repository for real models
  }

  @Subscription(() => RootCertificate, {
    subscribe: () => MQ.getMQ().on("newRootCertificate"),
  })
  newRootCertificate(
    @Root() rootCertificate: RootCertificate
  ): RootCertificate {
    return rootCertificate;
  }

  @FieldResolver()
  async block(@Root() rc: RootCertificate): Promise<Block> {
    const block = await Block.findOne(rc.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
