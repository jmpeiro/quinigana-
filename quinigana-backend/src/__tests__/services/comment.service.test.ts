jest.mock('../../config/environment', () => ({
  env: {
    nodeEnv: 'test',
    frontendUrl: 'http://localhost:4200',
    db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' },
    jwt: { accessSecret: 'test-secret-min-32-chars-long!!!', refreshSecret: 'test-refresh-min-32-chars!!!!!!!', accessExpiry: '15m', refreshExpiry: '7d' },
    email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
    google: { clientId: '', clientSecret: '', callbackUrl: '' },
    rateLimit: { windowMs: 900000, max: 100 },
  },
}));
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));

jest.mock('../../models/comment.model');
jest.mock('../../models/proposal.model');
jest.mock('../../models/group.model');

import { CommentService } from '../../services/comment.service';
import { CommentModel } from '../../models/comment.model';
import { ProposalModel } from '../../models/proposal.model';
import { GroupModel } from '../../models/group.model';

const mockCommentModel = CommentModel as jest.Mocked<typeof CommentModel>;
const mockProposalModel = ProposalModel as jest.Mocked<typeof ProposalModel>;
const mockGroupModel = GroupModel as jest.Mocked<typeof GroupModel>;

describe('CommentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addComment', () => {
    it('should create comment and return it with user info', async () => {
      (mockProposalModel.findById as jest.Mock).mockResolvedValue({ id: 1, group_id: 5 });
      (mockGroupModel.isMember as jest.Mock).mockResolvedValue(true);
      (mockCommentModel.create as jest.Mock).mockResolvedValue(10);
      (mockCommentModel.findByProposal as jest.Mock).mockResolvedValue([
        { id: 10, message: 'Test comment', user_id: 1, first_name: 'Juan' },
      ]);

      const result = await CommentService.addComment(1, 1, 'Test comment');

      expect(mockProposalModel.findById).toHaveBeenCalledWith(1);
      expect(mockGroupModel.isMember).toHaveBeenCalledWith(5, 1);
      expect(mockCommentModel.create).toHaveBeenCalledWith(1, 1, 'Test comment');
      expect(result).toEqual(expect.objectContaining({ id: 10, message: 'Test comment' }));
    });

    it('should throw 404 when proposal not found', async () => {
      (mockProposalModel.findById as jest.Mock).mockResolvedValue(null);

      try {
        await CommentService.addComment(999, 1, 'Comment');
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.message).toBe('Proposal not found');
        expect(err.statusCode).toBe(404);
      }
    });

    it('should throw 403 when user is not a group member', async () => {
      (mockProposalModel.findById as jest.Mock).mockResolvedValue({ id: 1, group_id: 5 });
      (mockGroupModel.isMember as jest.Mock).mockResolvedValue(false);

      try {
        await CommentService.addComment(1, 99, 'Comment');
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.message).toBe('You are not a member of this group');
        expect(err.statusCode).toBe(403);
      }
    });

    it('should throw if created comment cannot be retrieved', async () => {
      (mockProposalModel.findById as jest.Mock).mockResolvedValue({ id: 1, group_id: 5 });
      (mockGroupModel.isMember as jest.Mock).mockResolvedValue(true);
      (mockCommentModel.create as jest.Mock).mockResolvedValue(10);
      (mockCommentModel.findByProposal as jest.Mock).mockResolvedValue([]);

      await expect(CommentService.addComment(1, 1, 'Comment')).rejects.toThrow('Failed to retrieve created comment');
    });
  });

  describe('getComments', () => {
    it('should return paginated comments', async () => {
      const comments = [
        { id: 1, message: 'A' },
        { id: 2, message: 'B' },
      ];
      (mockCommentModel.findByProposal as jest.Mock).mockResolvedValue(comments);
      (mockCommentModel.countByProposal as jest.Mock).mockResolvedValue(15);

      const result = await CommentService.getComments(1, 1, 10);

      expect(result).toEqual({
        items: comments,
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2,
      });

      expect(mockCommentModel.findByProposal).toHaveBeenCalledWith(1, 1, 10);
      expect(mockCommentModel.countByProposal).toHaveBeenCalledWith(1);
    });

    it('should calculate totalPages correctly', async () => {
      (mockCommentModel.findByProposal as jest.Mock).mockResolvedValue([]);
      (mockCommentModel.countByProposal as jest.Mock).mockResolvedValue(21);

      const result = await CommentService.getComments(1, 1, 10);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment when user owns it', async () => {
      (mockCommentModel.findById as jest.Mock).mockResolvedValue({ id: 1, user_id: 5 });
      (mockCommentModel.delete as jest.Mock).mockResolvedValue(undefined);

      await CommentService.deleteComment(1, 5);

      expect(mockCommentModel.delete).toHaveBeenCalledWith(1);
    });

    it('should throw 404 when comment not found', async () => {
      (mockCommentModel.findById as jest.Mock).mockResolvedValue(null);

      try {
        await CommentService.deleteComment(999, 1);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.message).toBe('Comment not found');
        expect(err.statusCode).toBe(404);
      }
    });

    it('should throw 403 when user does not own comment', async () => {
      (mockCommentModel.findById as jest.Mock).mockResolvedValue({ id: 1, user_id: 5 });

      try {
        await CommentService.deleteComment(1, 99);
        fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err.message).toBe('You can only delete your own comments');
        expect(err.statusCode).toBe(403);
      }
    });
  });
});
