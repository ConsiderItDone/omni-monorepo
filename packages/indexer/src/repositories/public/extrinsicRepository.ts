import { EntityRepository, Repository } from "typeorm";
import Extrinsic from "../../models/public/extrinsic";
import MQ from "../../mq";

type NewExtrinsicParam = {
  index: number;
  length: number;
  versionInfo: string;
  callCode: string;
  callModuleFunction: string;
  callModule: string;
  params: string;
  account: string | null;
  signature: string | null;
  nonce: number | null;
  era: string | null;
  hash: string;
  isSigned: boolean;
  success: boolean;
  fee: number;
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
    account,
    signature,
    nonce,
    era,
    hash,
    isSigned,
    success,
    fee,
    blockId,
  }: NewExtrinsicParam) {
    const extrinsic = await this.save({
      index,
      length,
      versionInfo,
      callCode,
      callModuleFunction,
      callModule,
      params,
      account,
      signature,
      nonce,
      era,
      hash,
      isSigned,
      success,
      fee,
      blockId,
    });

    MQ.getMQ().emit("newExtrinsic", extrinsic);

    return;
  }

  public async addList(list: NewExtrinsicParam[]) {
    const extrinsics = await this.save(list);
    for (const extrinsic of extrinsics) {
      MQ.getMQ().emit("newExtrinsic", extrinsic);
    }

    return extrinsics;
  }
}
