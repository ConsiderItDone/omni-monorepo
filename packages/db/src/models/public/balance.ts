import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ID, ObjectType, Int } from "type-graphql";
import Block from "./block";
import { Account } from "../index";

@ObjectType()
@Index("balance_pk", ["balanceId"], { unique: true })
@Entity("balance", { schema: "public" })
export default class Balance extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "balance_id" })
  public balanceId: number;

  @Field(() => Number)
  @Column("numeric", { name: "free" })
  public free: number;

  @Field(() => Number)
  @Column("numeric", { name: "reserved" })
  public reserved: number;

  @Field(() => Number)
  @Column("numeric", { name: "misc_frozen" })
  public miscFrozen: number;

  @Field(() => Number)
  @Column("numeric", { name: "fee_frozen" })
  public feeFrozen: number;

  @Field(() => Int)
  @Column("integer", { name: "account_id" })
  public accountId: number;

  @Field(() => Account)
  @OneToOne(() => Account, (account) => account.balance)
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  public account: Block;
}
