import { CommentModel } from '../models/comment.model';
import { ProposalModel } from '../models/proposal.model';
import { GroupModel } from '../models/group.model';
import { ProposalCommentWithUser } from '../types';

export class CommentService {
  static async addComment(proposalId: number, userId: number, message: string): Promise<ProposalCommentWithUser> {
    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) {
      throw Object.assign(new Error('Proposal not found'), { statusCode: 404 });
    }

    const isMember = await GroupModel.isMember(proposal.group_id, userId);
    if (!isMember) {
      throw Object.assign(new Error('You are not a member of this group'), { statusCode: 403 });
    }

    const id = await CommentModel.create(proposalId, userId, message);

    // Fetch the created comment with user info
    const comments = await CommentModel.findByProposal(proposalId, 1, 1000);
    const created = comments.find(c => c.id === id);
    if (!created) {
      throw new Error('Failed to retrieve created comment');
    }
    return created;
  }

  static async getComments(proposalId: number, page: number, limit: number) {
    const [items, total] = await Promise.all([
      CommentModel.findByProposal(proposalId, page, limit),
      CommentModel.countByProposal(proposalId),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async deleteComment(commentId: number, userId: number): Promise<void> {
    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      throw Object.assign(new Error('Comment not found'), { statusCode: 404 });
    }
    if (comment.user_id !== userId) {
      throw Object.assign(new Error('You can only delete your own comments'), { statusCode: 403 });
    }
    await CommentModel.delete(commentId);
  }
}
