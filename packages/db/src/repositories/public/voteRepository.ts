import { EntityRepository, Repository } from "typeorm";
import Vote from "../../models/public/vote";

@EntityRepository(Vote)
export default class VoteRepository extends Repository<Vote> {
  public async changeCandidateVote(
    applicationId: number,
    initiatorId: number,
    targetId: number,
    isSupported: boolean
  ): Promise<void> {
    const vote = await this.findOne({
      initiatorId,
      applicationId,
    });

    if (!vote) {
      await this.save({
        applicationId,
        initiatorId,
        targetId,
        isSupported,
      });

      return;
    }

    await this.update(vote.voteId, {
      isSupported,
    });
  }
}
