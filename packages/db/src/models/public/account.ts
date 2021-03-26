import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { Field, ID, ObjectType, Int } from "type-graphql";
import VestingSchedule from "./vestingSchedule";
import { Balance } from "..";

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
  @Column("integer", { name: "nonce" })
  public nonce: number;

  @Field(() => Number)
  @Column("integer", { name: "refcount" })
  public refcount: number;

  @Field(() => Balance)
  @OneToOne(() => Balance, (balance) => balance.account)
  @JoinColumn([{ name: "balance_id", referencedColumnName: "balanceId" }])
  public balance: Balance;

  @Field(() => [VestingSchedule], { nullable: true })
  @OneToMany(
    () => VestingSchedule,
    (vestingSchedule) => vestingSchedule.account
  )
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  public vestingSchedules: VestingSchedule[];
}
