import {
  BaseEntity,
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";

import { ApplicationStatus } from "@nodle/utils/src/types";
import Block from "./block";

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

  @Field(() => String, { defaultValue: ApplicationStatus.pending })
  @Column("character varying", {
    name: "status",
    default: ApplicationStatus.pending,
  })
  public status: string;

  @Field(() => String)
  @Column("character varying", { name: "candidate" })
  public candidate: string;

  @Field(() => Number)
  @Column("numeric", { name: "candidate_deposit" })
  public candidateDeposit: number;

  @Field(() => String)
  @Column("character varying", { name: "metadata", default: "" })
  public metadata: string;

  @Field(() => String, { nullable: true })
  @Column("character varying", {
    name: "challenger",
    nullable: true,
    default: null,
  })
  public challenger: string | null;

  @Field(() => Number, { nullable: true })
  @Column("numeric", {
    name: "challenger_deposit",
    nullable: true,
    default: null,
  })
  public challengerDeposit: number | null;

  @Field(() => String, { nullable: true })
  @Column("character varying", {
    name: "votes_for",
    nullable: true,
    default: null,
  })
  public votesFor: string | null;

  @Field(() => [String])
  // TODO change to 'simple-array'
  @Column("character varying", {
    name: "voters_for",
    array: true,
    nullable: true,
  })
  public votersFor: string[];

  @Field(() => String, { nullable: true })
  @Column("character varying", {
    name: "votes_against",
    nullable: true,
    default: null,
  })
  public votesAgainst: string | null;

  @Field(() => [String])
  // TODO change to 'simple-array'
  @Column("character varying", {
    name: "voters_against",
    array: true,
    nullable: true,
  })
  public votersAgainst: string[];

  @Field(() => String)
  @Column("bigint", { name: "created_block" })
  public createdBlock: string;

  @Field(() => String)
  @Column("bigint", { name: "challenged_block" })
  public challengedBlock: string;
}
