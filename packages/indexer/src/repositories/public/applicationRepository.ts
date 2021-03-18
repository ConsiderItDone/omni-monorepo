import { EntityRepository, Repository } from "typeorm";
import { Application } from "../../models";

type NewApplicationParams = {
  blockId: number;
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
}
