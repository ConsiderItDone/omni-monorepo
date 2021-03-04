import { Resolver, Query } from "type-graphql";
import Migrations from "../models/public/migrations";

@Resolver()
export class DefaultResolver {
  @Query(() => [Migrations])
  protected getAllMigrations() {
    return Migrations.find(); // TODO: use repository for real models
  }
}
