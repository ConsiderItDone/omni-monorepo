import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from "typeorm";
import { Field, ID, Int, ObjectType } from "type-graphql";

import { ApplicationStatus } from "@nodle/utils/src/types";
import Block from "./block";
import { Account } from "../index";

@ObjectType()
@Index("application_pk", ["applicationId"], { unique: true })
@Entity("application", { schema: "public" })
export default class Application extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "application_id" })
  public applicationId: number;

  @Field(() => Number)
  @Column("integer", { name: "block_id" })
  public blockId: number;

  @Field(() => Block, { nullable: true })
  @ManyToOne(() => Block, (block) => block.blockId)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  public block: Block;

  @Field(() => Int)
  @Column("integer", { name: "candidate_id", nullable: true })
  public candidateId: number;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.balance)
  @JoinColumn([{ name: "candidate_id", referencedColumnName: "accountId" }])
  public candidate: Account;

  @Field(() => Number)
  @Column("numeric", { name: "candidate_deposit" })
  public candidateDeposit: number;

  @Field(() => String, { defaultValue: ApplicationStatus.pending })
  @Column("character varying", {
    name: "status",
    default: ApplicationStatus.pending,
  })
  public status: string;

  @Field(() => String)
  @Column("character varying", { name: "metadata", default: "" })
  public metadata: string;

  @Field(() => Int)
  @Column("integer", { name: "challenger_id", nullable: true })
  public challengerId: number;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.balance)
  @JoinColumn([{ name: "challenger_id", referencedColumnName: "accountId" }])
  public challenger: Account;

  @Field(() => Number, { nullable: true })
  @Column("numeric", {
    name: "challenger_deposit",
    nullable: true,
    default: null,
  })
  public challengerDeposit: number | null;

  @Field(() => String)
  @Column("bigint", { name: "created_block", nullable: true })
  public createdBlock: string; // TODO: id block

  @Field(() => String)
  @Column("bigint", { name: "challenged_block", nullable: true })
  public challengedBlock: string; // TODO: id block
}
