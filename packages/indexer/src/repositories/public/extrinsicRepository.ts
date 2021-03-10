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
    account: string | null;
    signature: string | null;
    nonce: number | null;
    era: string | null;
    hash: string;
    isSigned: boolean;
    success: boolean;
    fee: number;
    blockId: number;
}

@EntityRepository(Extrinsic)
export default class ExtrinsicRepository extends Repository<Extrinsic> {
    public add({
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
        blockId
    }: NewExtrinsicParam) {
        return this.save({
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
            blockId
        });
    }

    public addList(list: NewExtrinsicParam[]) {
        return this.save(list);
    }
}