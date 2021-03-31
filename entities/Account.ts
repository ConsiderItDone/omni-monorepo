import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Balance } from "./Balance";

@Index("account_pk", ["accountId"], { unique: true })
@Entity("account", { schema: "public" })
export class Account {
  @PrimaryGeneratedColumn({ type: "integer", name: "account_id" })
  accountId: number;

  @Column("character varying", { name: "address" })
  address: string;

  @Column("integer", { name: "nonce", nullable: true })
  nonce: number | null;

  @Column("integer", { name: "refcount", nullable: true })
  refcount: number | null;

  @OneToMany(() => Balance, (balance) => balance.account)
  balances: Balance[];
}
