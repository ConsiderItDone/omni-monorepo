import { Resolver, FieldResolver, Root } from "type-graphql";
import RootCertificate from "@nodle/db/src/models/public/rootCertificate";
import Block from "@nodle/db/src/models/public/block";
import { createBaseResolver } from "../baseResolver";
import { singleFieldResolver } from "../fieldsResolver";

const RootCertificateBaseResolver = createBaseResolver("RootCertificate", RootCertificate);

@Resolver(RootCertificate)
export default class RootCertificateResolver extends RootCertificateBaseResolver {
  @FieldResolver()
  block(@Root() source: RootCertificate): Promise<Block> {
    return singleFieldResolver(source, Block, "blockId");
  }
}
