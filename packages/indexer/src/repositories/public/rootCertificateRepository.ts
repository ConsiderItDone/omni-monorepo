import { EntityRepository, Repository } from "typeorm";
import RootCertificate from "../../models/public/RootCertificate";

type NewRootCertificateParam = {
  rootCertificateId: number;
  owner: string;
  key: string;
  created: Date;
  revoked: boolean;
  childRevocations: string[] | null;
  blockId: number;
};

@EntityRepository(RootCertificate)
export default class RootCertificateRepository extends Repository<RootCertificate> {
  public add({
    rootCertificateId,
    owner,
    key,
    created,
    revoked,
    childRevocations,
    blockId,
  }: NewRootCertificateParam) {
    return this.save({
      rootCertificateId,
      owner,
      key,
      created,
      revoked,
      childRevocations,
      blockId,
    });
  }
}
