import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Field, ID, ObjectType } from "type-graphql";
import { VestingSchedule } from "..";

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

  @Field(() => Number)
  @Column("numeric", { name: "balance", default: 0 })
  public balance: number;

  @Field(() => [VestingSchedule], { nullable: true })
  @OneToMany(
    () => VestingSchedule,
    (vestingSchedule) => vestingSchedule.account
  )
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  public vestingSchedules: VestingSchedule[];
}
