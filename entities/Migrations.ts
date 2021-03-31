import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("PK_cd92fd1100dbb343ecf81b475d4", ["id"], { unique: true })
@Entity("migrations", { schema: "public" })
export class Migrations {
  @PrimaryGeneratedColumn({ type: "integer", name: "id" })
  id: number;

  @Column("timestamp without time zone", { name: "timestamp" })
  timestamp: Date;

  @Column("character varying", { name: "name" })
  name: string;
}
