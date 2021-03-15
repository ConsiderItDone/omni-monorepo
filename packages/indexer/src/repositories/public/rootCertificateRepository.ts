import { EntityRepository, Repository } from "typeorm";
import RootCertificate from "../../models/public/rootCertificate";

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
  public add({
    owner,
    key,
    created,
    renewed,
    revoked,
    childRevocations,
    blockId,
  }: NewRootCertificateParam) {
    return this.save({
      owner,
      key,
      created,
      renewed,
      revoked,
      childRevocations,
      blockId,
    });
  }
}
