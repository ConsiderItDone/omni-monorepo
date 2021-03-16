import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
@Index("application_pk", ["applicationId"], { unique: true })
@Entity("application", { schema: "public" })
export default class Application extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "application_id" })
  public applicationId: number;

  @Field(()=> Number)
  @Column("integer", { name: "block_id" })
  public blockId: number;
}
