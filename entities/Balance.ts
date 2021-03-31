import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Account } from "./Account";

@Index("fki_fk_account_id", ["accountId"], {})
@Index("balance_pk", ["balanceId"], { unique: true })
@Entity("balance", { schema: "public" })
export class Balance {
  @PrimaryGeneratedColumn({ type: "integer", name: "balance_id" })
  balanceId: number;

  @Column("numeric", { name: "free" })
  free: string;

  @Column("numeric", { name: "reserved" })
  reserved: string;

  @Column("numeric", { name: "misc_frozen", nullable: true })
  miscFrozen: string | null;

  @Column("numeric", { name: "fee_frozen", nullable: true })
  feeFrozen: string | null;

  @Column("integer", { name: "account_id", nullable: true })
  accountId: number | null;

  @ManyToOne(() => Account, (account) => account.balances)
  @JoinColumn([{ name: "account_id", referencedColumnName: "accountId" }])
  account: Account;
}
