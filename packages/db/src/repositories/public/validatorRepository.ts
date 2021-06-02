import { EntityRepository, Repository } from "typeorm";
import { Validator } from "@nodle/db/src/models/";

type NewValidatorParam = {
  accountId: number;
  consumers: number;
  providers: number;
};

@EntityRepository(Validator)
export default class ValidatorRepository extends Repository<Validator> {
  public async add({ accountId, consumers, providers }: NewValidatorParam): Promise<Validator> {
    return await this.save({
      accountId,
      consumers,
      providers,
    });
  }
  public async findByAccountAddress(accountAddress: string): Promise<Validator> {
    return await this.findOne({ account: { address: accountAddress } });
  }
  public async replace(validatorId: number, validatorData: NewValidatorParam): Promise<Validator> {
    return await this.save({
      validatorId,
      ...validatorData,
    });
  }

  public async upsert(accountAddress: string, validatorData: NewValidatorParam): Promise<Validator> {
    const existingValidator = await this.findByAccountAddress(accountAddress);

    if (existingValidator) {
      return await this.replace(existingValidator.validatorId, validatorData);
    } else {
      return await this.add(validatorData);
    }
  }
}
