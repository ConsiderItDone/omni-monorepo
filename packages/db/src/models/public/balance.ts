import { BaseEntity, Column, Entity, Index, OneToOne, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Field, ID, ObjectType, Int } from "type-graphql";
import { Account } from "../index";
import Block from "./block";

@ObjectType()
@Index("balance_pk", ["balanceId"], { unique: true })
@Entity("balance", { schema: "public" })
export default class Balance extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "balance_id" })
  public balanceId: number;

  @Field(() => Number)
  @Column("bigint", { name: "free" })
  public free: string;

  @Field(() => Number)
  @Column("bigint", { name: "reserved" })
  public reserved: string;

  @Field(() => Number)
  @Column("bigint", { name: "misc_frozen" })
  public miscFrozen: string;

  @Field(() => Number)
  @Column("bigint", { name: "fee_frozen" })
  public feeFrozen: string;

  @Field(() => Int)
  @Column("integer", { name: "account_id" })
  public accountId: number;

  @Field(() => Account, { nullable: true })
  @OneToOne(() => Account, (account) => account.balance)
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  public account: Account;

  @Field(() => Int)
  @Column("integer", { name: "block_id", nullable: true })
  public blockId: number;

  @Field(() => Block, { nullable: true })
  @ManyToOne(() => Block, (block) => block.events)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  public block: Block;
}
