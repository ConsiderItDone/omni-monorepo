import { EntityRepository, Repository, UpdateResult } from "typeorm";
import RootCertificate from "../../models/public/rootCertificate";
import MQ from "../../../../graphql-server/mq";

type NewRootCertificateParam = {
  owner: string;
  key: string;
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
    owner,
    key,
    created,
    renewed,
    revoked,
    validity,
    childRevocations,
    blockId,
  }: NewRootCertificateParam): Promise<RootCertificate> {
    const rootCertificate = await this.save({
      owner,
      key,
      created,
      renewed,
      revoked,
      validity,
      childRevocations,
      blockId,
    });

    MQ.getMQ().emit<RootCertificate>("newRootCertificate", rootCertificate);

    return rootCertificate;
  }
  public replace(
    rootCertificateId: number,
    certificateData: NewRootCertificateParam
  ): Promise<UpdateResult> {
    return this.update(rootCertificateId, certificateData);
  }

  public async upsert(
    certificateKey: string,
    certificateData: NewRootCertificateParam
  ): Promise<UpdateResult | RootCertificate> {
    const existingRootCertificate = await this.findByKey(certificateKey);
    if (existingRootCertificate) {
      return await this.replace(
        existingRootCertificate.rootCertificateId,
        certificateData
      );
    } else {
      return await this.add(certificateData);
    }
  }

  public async findByKey(certificateId: string): Promise<RootCertificate> {
    return await this.findOne({ key: certificateId });
  }
}
