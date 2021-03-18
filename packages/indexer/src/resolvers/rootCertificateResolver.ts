import {
  Resolver,
  Query,
  Arg,
  FieldResolver,
  Root,
  Subscription,
} from "type-graphql";
import RootCertificate from "../models/public/rootCertificate";
import Block from "../models/public/block";
import Log from "../models/public/log";
import MQ from "../mq";

@Resolver(RootCertificate)
export default class RootCertificateResolver {
  @Query(() => RootCertificate)
  async rootCertificate(@Arg("id") id: number) {
    const rc = await RootCertificate.findOne(id);
    if (rc === undefined) {
      throw new Error(`RootCertificate ${id} not found`);
    }

    return rc;
  }

  @Query(() => [RootCertificate])
  protected rootCertificates() {
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
  async block(@Root() rc: RootCertificate) {
    const block = await Block.findOne(rc.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
