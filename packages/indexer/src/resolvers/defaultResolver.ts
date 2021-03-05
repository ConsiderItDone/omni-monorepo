import { Resolver, Query } from "type-graphql";
import Migrations from "../models/public/migrations";
import Block from "../models/public/block";

@Resolver()
export class DefaultResolver {
  @Query(() => [Migrations])
  protected getAllMigrations() {
    return Migrations.find(); // TODO: use repository for real models
  }

  @Query(() => [Block])
  protected getAllBlocks() {
    return Block.find(); // TODO: use repository for real models
  }
}
