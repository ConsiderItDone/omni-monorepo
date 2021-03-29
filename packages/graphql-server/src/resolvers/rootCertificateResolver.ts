import { Resolver, FieldResolver, Root } from "type-graphql";
import RootCertificate from "@nodle/db/src/models/public/rootCertificate";
import Block from "@nodle/db/src/models/public/block";
import { createBaseResolver } from "../baseResolver";

const RootCertificateBaseResolver = createBaseResolver(
  "RootCertificate",
  RootCertificate
);

@Resolver(RootCertificate)
export default class RootCertificateResolver extends RootCertificateBaseResolver {
  @FieldResolver()
  async block(@Root() rc: RootCertificate): Promise<Block> {
    const block = await Block.findOne(rc.blockId);
    if (!block) {
      return null;
    }

    return block;
  }
}
