import { EntityRepository, Repository } from "typeorm";
import ExtrinsicType from "../../models/public/extrinsicType";

@EntityRepository(ExtrinsicType)
export default class ExtrinsicTypeRepository extends Repository<ExtrinsicType> {
  public async addOrIgnore({
    name,
    moduleId,
  }: {
    name: string;
    moduleId: number;
  }): Promise<ExtrinsicType> {
    const type = await this.findOne({
      name,
    });

    if (type) {
      return type;
    }

    const newType = await this.save({
      name,
      moduleId,
    });

    return newType;
  }
}
