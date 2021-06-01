import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Field, ID, Int, ObjectType } from "type-graphql";
import { Account, Application } from "../index";

@ObjectType()
@Index("vote_pk", ["voteId"], { unique: true })
@Entity("vote", { schema: "public" })
export default class Vote extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: "integer", name: "vote_id" })
  public voteId: number;

  @Field(() => Int)
  @Column("integer", { name: "initiator_id", nullable: true })
  public initiatorId: number;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.accountId)
  @JoinColumn([{ name: "initiator_id", referencedColumnName: "accountId" }])
  public initiator: Account;

  @Field(() => Int)
  @Column("integer", { name: "target_id", nullable: true })
  public targetId: number;

  @Field(() => Account, { nullable: true })
  @ManyToOne(() => Account, (account) => account.accountId)
  @JoinColumn([{ name: "target_id", referencedColumnName: "accountId" }])
  public target: Account;

  @Field(() => Int)
  @Column("integer", { name: "application_id", nullable: true })
  public applicationId: number;

  @Field(() => Application, { nullable: true })
  @ManyToOne(() => Application, (app) => app.applicationId)
  @JoinColumn([
    { name: "application_id", referencedColumnName: "applicationId" },
  ])
  public application: Application;

  @Field(() => Boolean, { nullable: true })
  @Column("boolean", { name: "is_supported", nullable: true })
  public isSupported: boolean;
}
