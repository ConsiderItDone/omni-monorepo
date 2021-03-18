import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
@Index("account_pk", ["accountId"], { unique: true })
@Entity("account", { schema: "public" })
export default class Account extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "account_id" })
  public accountId: number;

  @Field(() => String)
  @Column("character varying", { name: "address" })
  public address: string;

  @Field(() => Number)
  @Column("numeric", { name: "balance", default: 0 })
  public balance: number;
}