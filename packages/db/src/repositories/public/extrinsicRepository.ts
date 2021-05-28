import { EntityRepository, Repository } from "typeorm";
import Extrinsic from "../../models/public/extrinsic";

type NewExtrinsicParam = {
  index: number;
  length: number;
  versionInfo: string;
  callCode: string;
  callModuleFunction: string;
  callModule: string;
  params: string;
  signerId: number | null;
  signature: string | null;
  nonce: number | null;
  era: string | null;
  hash: string;
  isSigned: boolean;
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
    callModuleFunction,
    callModule,
    params,
    signerId,
    signature,
    nonce,
    era,
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
      callModuleFunction,
      callModule,
      params,
      signerId,
      signature,
      nonce,
      era,
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
