import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Block } from "./Block";

@Index("root_certificate_pk", ["rootCertificateId"], { unique: true })
@Entity("root_certificate", { schema: "public" })
export class RootCertificate {
  @PrimaryGeneratedColumn({ type: "integer", name: "root_certificate_id" })
  rootCertificateId: number;

  @Column("character varying", { name: "owner" })
  owner: string;

  @Column("character varying", { name: "key" })
  key: string;

  @Column("boolean", { name: "revoked", default: () => "false" })
  revoked: boolean;

  @Column("varchar", { name: "child_revocations", nullable: true, array: true })
  childRevocations: string[] | null;

  @Column("bigint", { name: "created", nullable: true })
  created: string | null;

  @Column("bigint", { name: "renewed", nullable: true })
  renewed: string | null;

  @Column("bigint", { name: "validity", nullable: true })
  validity: string | null;

  @ManyToOne(() => Block, (block) => block.rootCertificates)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  block: Block;
}
