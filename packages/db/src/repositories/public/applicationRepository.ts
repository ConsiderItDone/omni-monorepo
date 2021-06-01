import { EntityRepository, Repository, UpdateResult } from "typeorm";
import { Application } from "../../models";

type NewApplicationParams = {
  blockId: number;
  accountId: number;
  status: string;
  candidateDeposit: number;
  metadata: string;
  challenger: string;
  challengerDeposit: number;
  votesFor: string;
  votersFor: string[];
  votesAgainst: string;
  votersAgainst: string[];
  createdBlock: string;
  challengedBlock: string;
};

@EntityRepository(Application)
export default class ApplicationRepository extends Repository<Application> {
  public add({
    blockId,
    accountId,
    status,
    candidateDeposit,
    metadata,
    challenger,
    challengerDeposit,
    votesFor,
    votersFor,
    votesAgainst,
    votersAgainst,
    createdBlock,
    challengedBlock,
  }: NewApplicationParams): Promise<Application> {
    return this.save({
      blockId,
      accountId,
      status,
      candidateDeposit,
      metadata,
      challenger,
      challengerDeposit,
      votesFor,
      votersFor,
      votesAgainst,
      votersAgainst,
      createdBlock,
      challengedBlock,
    });
  }
  public replace(
    applicationId: number,
    applicationData: NewApplicationParams
  ): Promise<UpdateResult> {
    return this.update(applicationId, applicationData);
  }
  public async upsert(
    applicationData: Application
  ): Promise<UpdateResult | Application> {
    const existingApplication = await this.findCandidate(
      applicationData.accountId
    );

    if (existingApplication) {
      return await this.replace(
        existingApplication.applicationId,
        applicationData
      );
    }

    return await this.add(applicationData);
  }
  public async findCandidate(accountId: number): Promise<Application> {
    return await this.findOne({ accountId });
  }
  public async changeCandidateVote(
    initiatorId: number,
    targetId: number,
    value: boolean
  ): Promise<void> {
    const initiator = await this.findCandidate(initiatorId);
    // Change's initiator data only if he is in DB, otherwise all data will be empty (he is not applicant)
    if (initiator) {
      if (value) {
        initiator.votesFor = String(targetId); // TODO: check it
      } else {
        initiator.votesAgainst = String(targetId); // TODO: check it
      }
      await this.save(initiator);
    }
    const target = await this.findCandidate(targetId);
    if (value) {
      target.votersFor = [String(...target.votersFor), String(initiatorId)];
    } else {
      target.votersAgainst = [
        String(...target.votersAgainst),
        String(initiatorId),
      ];
    }
    await this.save(target);
  }
  public async addChallenger(
    challengedId: number,
    challengerAcc: string,
    challengerDeposit: number,
    blockNumber: string
  ): Promise<void> {
    const candidate = await this.findCandidate(challengedId);
    candidate.challenger = challengerAcc;
    candidate.challengerDeposit = challengerDeposit;
    candidate.challengedBlock = blockNumber;
    await this.save(candidate);
  }
}
