import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Block } from "./Block";

@Index("extrinsic_pk", ["extrinsicId"], { unique: true })
@Entity("extrinsic", { schema: "public" })
export class Extrinsic {
  @PrimaryGeneratedColumn({ type: "integer", name: "extrinsic_id" })
  extrinsicId: number;

  @Column("integer", { name: "index" })
  index: number;

  @Column("integer", { name: "length" })
  length: number;

  @Column("character varying", { name: "version_info" })
  versionInfo: string;

  @Column("character varying", { name: "call_code" })
  callCode: string;

  @Column("character varying", { name: "call_module_function" })
  callModuleFunction: string;

  @Column("character varying", { name: "call_module" })
  callModule: string;

  @Column("text", { name: "params" })
  params: string;

  @Column("character varying", { name: "signer", nullable: true })
  signer: string | null;

  @Column("character varying", { name: "signature", nullable: true })
  signature: string | null;

  @Column("integer", { name: "nonce", nullable: true })
  nonce: number | null;

  @Column("character varying", { name: "era", nullable: true })
  era: string | null;

  @Column("character varying", { name: "hash" })
  hash: string;

  @Column("boolean", { name: "is_signed", default: () => "false" })
  isSigned: boolean;

  @Column("boolean", { name: "success", default: () => "false" })
  success: boolean;

  @ManyToOne(() => Block, (block) => block.extrinsics)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  block: Block;
}
