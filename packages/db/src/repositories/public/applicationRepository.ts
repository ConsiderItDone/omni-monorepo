import { EntityRepository, Repository, UpdateResult } from "typeorm";
import { Application } from "../../models";

type NewApplicationParams = {
  blockId: number;
  status: string;
  candidate: string;
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
    status,
    candidate,
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
      status,
      candidate,
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
    accountId: string,
    applicationData: Application
  ): Promise<UpdateResult | Application> {
    const existingApplication = await this.findCandidate(accountId);

    if (existingApplication) {
      return await this.replace(
        existingApplication.applicationId,
        applicationData
      );
    } else {
      return await this.add(applicationData);
    }
  }
  public async findCandidate(accountId: string): Promise<Application> {
    return await this.findOne({ candidate: accountId });
  }
  public async changeCandidateVote(
    initiatorId: string,
    targetId: string,
    value: boolean
  ): Promise<void> {
    const initiator = await this.findCandidate(initiatorId);
    // Change's initiator data only if he is in DB, otherwise all data will be empty (he is not applicant)
    if (initiator) {
      if (value) initiator.votesFor = targetId;
      else initiator.votesAgainst = targetId;
      await this.save(initiator);
    }
    const target = await this.findCandidate(targetId);
    if (value) target.votersFor = [...target.votersFor, initiatorId];
    else target.votersAgainst = [...target.votersAgainst, initiatorId];
    await this.save(target);
  }
  public async addChallenger(
    challengedAcc: string,
    challengerAcc: string,
    challengerDeposit: number,
    blockNumber: string
  ): Promise<void> {
    const candidate = await this.findCandidate(challengedAcc);
    candidate.challenger = challengerAcc;
    candidate.challengerDeposit = challengerDeposit;
    candidate.challengedBlock = blockNumber;
    await this.save(candidate);
  }
}
