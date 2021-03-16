import { Resolver, Query, Arg, FieldResolver, Root } from "type-graphql";
import RootCertificate from "../models/public/rootCertificate";
import Block from "../models/public/block";

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

  @FieldResolver()
  async block(@Root() rc: RootCertificate) {
    const block = await Block.findOne(rc.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
