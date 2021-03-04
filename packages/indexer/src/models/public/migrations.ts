// Useless file, just for example

import { Column, Entity, PrimaryGeneratedColumn, BaseEntity } from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
@Entity({ schema: "public" })
export default class Migrations extends BaseEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn({
        name: "id",
    })
    public id: number;

    @Field(() => Date)
    @Column({
        name: "timestamp",
    })
    public timestamp: Date;

    @Field(() => String)
    @Column({
        name: "name",
    })
    public name: string;

}
