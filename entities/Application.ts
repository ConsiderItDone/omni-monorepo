import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("application_pk", ["applicationId"], { unique: true })
@Entity("application", { schema: "public" })
export class Application {
  @PrimaryGeneratedColumn({ type: "integer", name: "application_id" })
  applicationId: number;

  @Column("integer", { name: "block_id" })
  blockId: number;

  @Column("character varying", { name: "candidate" })
  candidate: string;

  @Column("numeric", { name: "candidate_deposit", nullable: true })
  candidateDeposit: string | null;

  @Column("character varying", { name: "metadata", nullable: true })
  metadata: string | null;

  @Column("character varying", { name: "challenger", nullable: true })
  challenger: string | null;

  @Column("numeric", { name: "challenger_deposit", nullable: true })
  challengerDeposit: string | null;

  @Column("character varying", { name: "votes_for", nullable: true })
  votesFor: string | null;

  @Column("varchar", { name: "voters_for", array: true })
  votersFor: string[];

  @Column("character varying", { name: "votes_against", nullable: true })
  votesAgainst: string | null;

  @Column("varchar", { name: "voters_against", array: true })
  votersAgainst: string[];

  @Column("bigint", { name: "created_block", nullable: true })
  createdBlock: string | null;

  @Column("bigint", { name: "challenged_block", nullable: true })
  challengedBlock: string | null;

  @Column("character varying", { name: "status", nullable: true })
  status: string | null;
}
