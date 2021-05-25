import { EntityRepository, Repository } from "typeorm";
import Module from "../../models/public/module";

@EntityRepository(Module)
export default class ModuleRepository extends Repository<Module> {
  public async addOrIgnore({ name }: { name: string }): Promise<Module> {
    const type = await this.findOne({
      name,
    });

    if (type) {
      return type;
    }

    const newType = await this.save({
      name,
    });

    return newType;
  }
}
