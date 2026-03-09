jest.mock('../../config/environment', () => ({
  env: { nodeEnv: 'test', frontendUrl: 'http://localhost:4200', db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' }, jwt: { accessSecret: 'test-secret-min-32-chars-long!!!', refreshSecret: 'test-refresh-min-32-chars!!!!!!!', accessExpiry: '15m', refreshExpiry: '7d' }, email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' }, google: { clientId: '', clientSecret: '', callbackUrl: '' }, rateLimit: { windowMs: 900000, max: 100 } },
}));
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));
jest.mock('../../services/proposal.service');
jest.mock('../../services/comment.service');
jest.mock('../../services/gamification.service');
jest.mock('../../models/proposal.model');

import { ProposalController } from '../../controllers/proposal.controller';
import { ProposalService } from '../../services/proposal.service';
import { CommentService } from '../../services/comment.service';
import { GamificationService } from '../../services/gamification.service';
import { ProposalModel } from '../../models/proposal.model';

const mockProposalService = ProposalService as jest.Mocked<typeof ProposalService>;
const mockCommentService = CommentService as jest.Mocked<typeof CommentService>;
const mockGamificationService = GamificationService as jest.Mocked<typeof GamificationService>;
const mockProposalModel = ProposalModel as jest.Mocked<typeof ProposalModel>;

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
function mockReq(overrides: any = {}): any {
  return { body: {}, params: {}, query: {}, cookies: {}, authUser: { userId: 1, email: 'test@test.com' }, ...overrides };
}

describe('ProposalController', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('search', () => {
    it('should use cursor pagination when cursor is present', async () => {
      mockProposalModel.searchWithCursor.mockResolvedValue({ data: [], nextCursor: null, prevCursor: null, total: 0 } as any);

      const req = mockReq({ query: { cursor: 'abc' } });
      const res = mockRes();
      await ProposalController.search(req, res);

      expect(mockProposalModel.searchWithCursor).toHaveBeenCalled();
    });

    it('should use cursor pagination when filters are present', async () => {
      mockProposalModel.searchWithCursor.mockResolvedValue({ data: [], nextCursor: null, prevCursor: null, total: 0 } as any);

      const req = mockReq({ query: { status: 'approved', groupId: '1' } });
      const res = mockRes();
      await ProposalController.search(req, res);

      expect(mockProposalModel.searchWithCursor).toHaveBeenCalled();
    });

    it('should use offset pagination as fallback', async () => {
      mockProposalModel.searchWithOffset.mockResolvedValue({ items: [], total: 0 } as any);

      const req = mockReq({ query: {} });
      const res = mockRes();
      await ProposalController.search(req, res);

      expect(mockProposalModel.searchWithOffset).toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
      mockProposalModel.searchWithOffset.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ query: {} });
      const res = mockRes();
      await ProposalController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create', () => {
    it('should create proposal and grant XP', async () => {
      mockProposalService.createProposal.mockResolvedValue({ id: 1 } as any);
      mockGamificationService.processProposalCreated.mockResolvedValue(undefined);

      const req = mockReq({
        params: { groupId: '1' },
        body: { jornada_id: 1, predictions: [] },
      });
      const res = mockRes();
      await ProposalController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockGamificationService.processProposalCreated).toHaveBeenCalledWith(1);
    });

    it('should return 400 on creation error', async () => {
      mockProposalService.createProposal.mockRejectedValue(new Error('Jornada not open'));

      const req = mockReq({ params: { groupId: '1' }, body: {} });
      const res = mockRes();
      await ProposalController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getByGroup', () => {
    it('should return paginated proposals', async () => {
      mockProposalService.getProposals.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 });

      const req = mockReq({ params: { groupId: '1' }, query: {} });
      const res = mockRes();
      await ProposalController.getByGroup(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getDetail', () => {
    it('should return proposal detail', async () => {
      mockProposalService.getProposalDetail.mockResolvedValue({ id: 1 } as any);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await ProposalController.getDetail(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 when proposal not found', async () => {
      mockProposalService.getProposalDetail.mockResolvedValue(null);

      const req = mockReq({ params: { id: '999' } });
      const res = mockRes();
      await ProposalController.getDetail(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('update', () => {
    it('should update proposal', async () => {
      mockProposalService.updateProposal.mockResolvedValue({ id: 1 } as any);

      const req = mockReq({ params: { id: '1' }, body: { title: 'Updated' } });
      const res = mockRes();
      await ProposalController.update(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 when update fails', async () => {
      mockProposalService.updateProposal.mockRejectedValue(new Error('Only draft proposals can be edited'));

      const req = mockReq({ params: { id: '1' }, body: {} });
      const res = mockRes();
      await ProposalController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('submit', () => {
    it('should submit proposal for voting', async () => {
      mockProposalService.submitForVoting.mockResolvedValue({ id: 1, status: 'pending' } as any);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await ProposalController.submit(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('vote', () => {
    it('should register vote and grant XP', async () => {
      mockProposalService.vote.mockResolvedValue({ id: 1 } as any);
      mockGamificationService.processVoteCast.mockResolvedValue(undefined);

      const req = mockReq({ params: { id: '1' }, body: { vote: 'approve' } });
      const res = mockRes();
      await ProposalController.vote(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
      expect(mockGamificationService.processVoteCast).toHaveBeenCalledWith(1);
    });

    it('should return 400 on vote error', async () => {
      mockProposalService.vote.mockRejectedValue(new Error('Already voted'));

      const req = mockReq({ params: { id: '1' }, body: { vote: 'approve' } });
      const res = mockRes();
      await ProposalController.vote(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('addComment', () => {
    it('should add comment with valid message', async () => {
      mockCommentService.addComment.mockResolvedValue({ id: 1, message: 'Hello' } as any);

      const req = mockReq({ params: { id: '1' }, body: { message: 'Hello' } });
      const res = mockRes();
      await ProposalController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when message is empty', async () => {
      const req = mockReq({ params: { id: '1' }, body: { message: '' } });
      const res = mockRes();
      await ProposalController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    });

    it('should return 400 when message exceeds 1000 chars', async () => {
      const req = mockReq({ params: { id: '1' }, body: { message: 'x'.repeat(1001) } });
      const res = mockRes();
      await ProposalController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when message is missing', async () => {
      const req = mockReq({ params: { id: '1' }, body: {} });
      const res = mockRes();
      await ProposalController.addComment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      mockCommentService.deleteComment.mockResolvedValue(undefined);

      const req = mockReq({ params: { commentId: '1' } });
      const res = mockRes();
      await ProposalController.deleteComment(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('delete', () => {
    it('should delete proposal', async () => {
      mockProposalService.deleteProposal.mockResolvedValue(undefined);

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await ProposalController.delete(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 when cannot delete approved proposal', async () => {
      mockProposalService.deleteProposal.mockRejectedValue(new Error('Cannot delete an approved proposal'));

      const req = mockReq({ params: { id: '1' } });
      const res = mockRes();
      await ProposalController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
