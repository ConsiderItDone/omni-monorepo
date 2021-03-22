import { EntityRepository, Repository } from "typeorm";
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

type ApplicationParams = NewApplicationParams & {
  applicationId: number;
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
  public replace({
    applicationId,
    status,
    blockId,
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
  }: ApplicationParams): Promise<ApplicationParams> {
    return this.save({
      applicationId,
      status,
      blockId,
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
  public findCandidate(accountId: string) {
    return this.findOne({ candidate: accountId });
  }
}
