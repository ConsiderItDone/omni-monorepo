import { EntityRepository, Repository } from "typeorm";
import RootCertificate from "../../models/public/rootCertificate";
import MQ from "../../mq";

type NewRootCertificateParam = {
  owner: string;
  key: string;
  created: Date;
  renewed: Date;
  revoked: boolean;
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
    childRevocations,
    blockId,
  }: NewRootCertificateParam) {
    const rootCertificate = await this.save({
      owner,
      key,
      created,
      renewed,
      revoked,
      childRevocations,
      blockId,
    });

    MQ.getMQ().emit("newRootCertificate", rootCertificate);

    return rootCertificate;
  }
}
