import { EntityRepository, Repository, UpdateResult } from "typeorm";
import RootCertificate from "../../models/public/rootCertificate";

type NewRootCertificateParam = {
  ownerId: number;
  keyId: number;
  created: string;
  renewed: string;
  revoked: boolean;
  validity: number;
  childRevocations: string[] | null;
  blockId: number;
};

@EntityRepository(RootCertificate)
export default class RootCertificateRepository extends Repository<RootCertificate> {
  public async add({
    ownerId,
    keyId,
    created,
    renewed,
    revoked,
    validity,
    childRevocations,
    blockId,
  }: NewRootCertificateParam): Promise<RootCertificate> {
    const rootCertificate = await this.save({
      ownerId,
      keyId,
      created,
      renewed,
      revoked,
      validity,
      childRevocations,
      blockId,
    });

    return rootCertificate;
  }
  public replace(rootCertificateId: number, certificateData: NewRootCertificateParam): Promise<UpdateResult> {
    return this.update(rootCertificateId, certificateData);
  }
  //eslint-disable-next-line
  //@ts-ignore
  public async upsert(
    keyId: number,
    certificateData: NewRootCertificateParam
  ): Promise<UpdateResult | RootCertificate> {
    const existingRootCertificate = await this.findByKey(keyId);
    if (existingRootCertificate) {
      return await this.replace(existingRootCertificate.rootCertificateId, certificateData);
    } else {
      return await this.add(certificateData);
    }
  }

  public async findByKey(rootCertificateId: number): Promise<RootCertificate> {
    return await this.findOne({ rootCertificateId });
  }
}
