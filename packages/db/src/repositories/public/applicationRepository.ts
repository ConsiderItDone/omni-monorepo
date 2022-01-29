import { EntityRepository, Repository } from "typeorm";
import { Application } from "../../models";

type NewApplicationParams = {
  blockId: number;
  candidateId: number;
  status: string;
  candidateDeposit: number;
  metadata: string;
  challengerId: number;
  challengerDeposit: number;
  createdBlock: string;
  challengedBlock: string;
};

@EntityRepository(Application)
export default class ApplicationRepository extends Repository<Application> {
  public add({
    blockId,
    candidateId,
    status,
    candidateDeposit,
    metadata,
    challengerId,
    challengerDeposit,
    createdBlock,
    challengedBlock,
  }: NewApplicationParams): Promise<Application> {
    return this.save({
      blockId,
      candidateId,
      status,
      candidateDeposit,
      metadata,
      challengerId,
      challengerDeposit,
      createdBlock,
      challengedBlock,
    });
  }
  //eslint-disable-next-line
  //@ts-ignore
  public async upsert(applicationData: Application): Promise<number> {
    const existingApplication = await this.findCandidate(applicationData.candidateId);

    if (existingApplication) {
      await this.update(existingApplication.applicationId, applicationData);
      return existingApplication.applicationId;
    }

    return (await this.add(applicationData)).applicationId;
  }

  public async findCandidate(candidateId: number): Promise<Application> {
    return await this.findOne({ candidateId });
  }

  public async addChallenger(
    challengedId: number,
    challengerId: number,
    challengerDeposit: number,
    blockNumber: string
  ): Promise<void> {
    const candidate = await this.findCandidate(challengedId);
    candidate.challengerId = challengerId;
    candidate.challengerDeposit = challengerDeposit;
    candidate.challengedBlock = blockNumber;
    await this.save(candidate);
  }
}
