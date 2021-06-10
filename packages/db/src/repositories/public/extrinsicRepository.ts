import { EntityRepository, Repository } from "typeorm";
import Extrinsic from "../../models/public/extrinsic";

type NewExtrinsicParam = {
  index: number;
  length: number;
  versionInfo: string;
  callCode: string;
  moduleId: number;
  extrinsicTypeId: number;
  params: string;
  signerId: number | null;
  signature: string | null;
  nonce: number | null;
  era: string | null;
  hash: string;
  isSigned: boolean;
  fee: string | unknown;
  success: boolean;
  blockId: number;
};

@EntityRepository(Extrinsic)
export default class ExtrinsicRepository extends Repository<Extrinsic> {
  public async add({
    index,
    length,
    versionInfo,
    callCode,
    moduleId,
    extrinsicTypeId,
    params,
    signerId,
    signature,
    nonce,
    era,
    fee,
    hash,
    isSigned,
    success,
    blockId,
  }: NewExtrinsicParam): Promise<Extrinsic> {
    const extrinsic = await this.save({
      index,
      length,
      versionInfo,
      callCode,
      moduleId,
      extrinsicTypeId,
      params,
      signerId,
      signature,
      nonce,
      era,
      fee,
      hash,
      isSigned,
      success,
      blockId,
    });

    return extrinsic;
  }
  public async findByHash(hash: string): Promise<Extrinsic> {
    return await this.findOne({ hash: hash });
  }
  public async addList(list: NewExtrinsicParam[]): Promise<Extrinsic[]> {
    return await this.save(list);
  }
}
