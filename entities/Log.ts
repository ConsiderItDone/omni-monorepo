import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Block } from "./Block";

@Index("log_pk", ["logId"], { unique: true })
@Entity("log", { schema: "public" })
export class Log {
  @PrimaryGeneratedColumn({ type: "integer", name: "log_id" })
  logId: number;

  @Column("character varying", { name: "index" })
  index: string;

  @Column("character varying", { name: "type" })
  type: string;

  @Column("text", { name: "data" })
  data: string;

  @Column("boolean", { name: "is_finalized", default: () => "false" })
  isFinalized: boolean;

  @ManyToOne(() => Block, (block) => block.logs)
  @JoinColumn([{ name: "block_id", referencedColumnName: "blockId" }])
  block: Block;
}
