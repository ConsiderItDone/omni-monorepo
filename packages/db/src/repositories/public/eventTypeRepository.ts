import { EntityRepository, Repository } from "typeorm";
import EventType from "../../models/public/eventType";

@EntityRepository(EventType)
export default class EventTypeRepository extends Repository<EventType> {
  public async addOrIgnore({
    name,
    moduleId,
  }: {
    name: string;
    moduleId: number;
  }): Promise<EventType> {
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
