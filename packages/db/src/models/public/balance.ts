import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from "typeorm";
import { Field, ObjectType, Int } from "type-graphql";
import { TypeormLoader } from "type-graphql-dataloader";
import { Account } from "../index";
import Block from "./block";

@ObjectType()
@Index("balance_pk", ["balanceId"], { unique: true })
@Entity("balance", { schema: "public" })
export default class Balance extends BaseEntity {
  @Field(() => Int, { nullable: true })
  @PrimaryGeneratedColumn({ type: "integer", name: "balance_id" })
  public balanceId: number;

  @Field(() => String, { nullable: true })
  @Column("character varying", { name: "free" })
  public free: string;

  @Field(() => String, { nullable: true })
  @Column("character varying", { name: "reserved" })
  public reserved: string;

  @Field(() => String, { nullable: true })
  @Column("character varying", { name: "misc_frozen" })
  public miscFrozen: string;

  @Field(() => String, { nullable: true })
  @Column("character varying", { name: "fee_frozen" })
  public feeFrozen: string;

  @Field(() => Int, { nullable: true })
  @Column("integer", { name: "account_id" })
  public accountId: number;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.accountId)
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  @TypeormLoader()
  public account: Account;

  @Field(() => Int, { nullable: true })
  @Column("integer", { name: "block_id", nullable: true })
  public blockId: number;

  @Field(() => Block, { nullable: true })
  @ManyToOne(() => Block, (block) => block.events)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  @TypeormLoader()
  public block: Block;
}
