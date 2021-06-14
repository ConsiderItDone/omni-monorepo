import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn, OneToOne, JoinColumn } from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Account } from "@nodle/db/src/models";

@ObjectType()
@Index("validator_pk", ["validatorId"], { unique: true })
@Entity("validator", { schema: "public" })
export default class Validator extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ type: "integer", name: "validator_id" })
  public validatorId: number;

  @Field(() => Number)
  @Column("integer", { name: "consumers" })
  public consumers: number;

  @Field(() => Number)
  @Column("integer", { name: "providers" })
  public providers: number;

  @Field(() => Int)
  @Column("integer", { name: "account_id", unique: true })
  public accountId: number;

  @Field(() => Account)
  @OneToOne(() => Account, (account) => account.validator)
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  public account: Account;
}
