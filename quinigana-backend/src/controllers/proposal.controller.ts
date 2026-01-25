import { Request, Response } from 'express';
import { ProposalService } from '../services/proposal.service';
import { CommentService } from '../services/comment.service';
import { GamificationService } from '../services/gamification.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';

export class ProposalController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.groupId);
      const userId = req.authUser!.userId;
      const proposal = await ProposalService.createProposal(groupId, userId, req.body);
      GamificationService.processProposalCreated(userId).catch(() => {});
      sendSuccess(res, proposal, 'Proposal created', 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create proposal';
      sendError(res, 'CREATE_PROPOSAL_ERROR', message, 400);
    }
  }

  static async getByGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.groupId);
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const data = await ProposalService.getProposals(groupId, page, limit);
      sendSuccess(res, data);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch proposals', 500);
    }
  }

  static async getDetail(req: Request, res: Response): Promise<void> {
    try {
      const proposalId = parseId(req.params.id);
      const userId = req.authUser!.userId;
      const proposal = await ProposalService.getProposalDetail(proposalId, userId);
      if (!proposal) {
        sendError(res, 'PROPOSAL_NOT_FOUND', 'Proposal not found', 404);
        return;
      }
      sendSuccess(res, proposal);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch proposal', 500);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const proposalId = parseId(req.params.id);
      const userId = req.authUser!.userId;
      const proposal = await ProposalService.updateProposal(proposalId, userId, req.body);
      sendSuccess(res, proposal, 'Proposal updated');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update proposal';
      sendError(res, 'UPDATE_PROPOSAL_ERROR', message, 400);
    }
  }

  static async submit(req: Request, res: Response): Promise<void> {
    try {
      const proposalId = parseId(req.params.id);
      const userId = req.authUser!.userId;
      const proposal = await ProposalService.submitForVoting(proposalId, userId);
      sendSuccess(res, proposal, 'Proposal submitted for voting');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to submit proposal';
      sendError(res, 'SUBMIT_PROPOSAL_ERROR', message, 400);
    }
  }

  static async vote(req: Request, res: Response): Promise<void> {
    try {
      const proposalId = parseId(req.params.id);
      const userId = req.authUser!.userId;
      const { vote } = req.body;
      const proposal = await ProposalService.vote(proposalId, userId, vote);
      GamificationService.processVoteCast(userId).catch(() => {});
      sendSuccess(res, proposal, 'Vote registered');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to vote';
      sendError(res, 'VOTE_ERROR', message, 400);
    }
  }

  static async getComments(req: Request, res: Response): Promise<void> {
    try {
      const proposalId = parseId(req.params.id);
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const data = await CommentService.getComments(proposalId, page, limit);
      sendSuccess(res, data);
    } catch (err: any) {
      sendError(res, 'COMMENTS_ERROR', err.message || 'Failed to fetch comments', err.statusCode || 500);
    }
  }

  static async addComment(req: Request, res: Response): Promise<void> {
    try {
      const proposalId = parseId(req.params.id);
      const userId = req.authUser!.userId;
      const { message } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        sendError(res, 'VALIDATION_ERROR', 'Message is required', 400);
        return;
      }
      if (message.length > 1000) {
        sendError(res, 'VALIDATION_ERROR', 'Message must not exceed 1000 characters', 400);
        return;
      }

      const comment = await CommentService.addComment(proposalId, userId, message.trim());
      sendSuccess(res, comment, 'Comment added', 201);
    } catch (err: any) {
      sendError(res, 'COMMENT_ERROR', err.message || 'Failed to add comment', err.statusCode || 400);
    }
  }

  static async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const commentId = parseId(req.params.commentId);
      const userId = req.authUser!.userId;
      await CommentService.deleteComment(commentId, userId);
      sendSuccess(res, null, 'Comment deleted');
    } catch (err: any) {
      sendError(res, 'DELETE_COMMENT_ERROR', err.message || 'Failed to delete comment', err.statusCode || 400);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const proposalId = parseId(req.params.id);
      const userId = req.authUser!.userId;
      await ProposalService.deleteProposal(proposalId, userId);
      sendSuccess(res, null, 'Proposal deleted');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete proposal';
      sendError(res, 'DELETE_PROPOSAL_ERROR', message, 400);
    }
  }
}
