jest.mock('../../config/environment', () => ({
  env: {
    port: 3000,
    nodeEnv: 'test',
    frontendUrl: 'http://localhost:4200',
    db: { host: 'localhost', port: 3306, user: 'root', password: '', name: 'test' },
    jwt: { accessSecret: 'test-secret-min-32-chars-long!!!', refreshSecret: 'test-refresh-min-32-chars!!!!!!!', accessExpiry: '15m', refreshExpiry: '7d' },
    email: { host: 'smtp.test.com', port: 587, user: 'test', pass: 'test', from: 'test@test.com' },
    google: { clientId: '', clientSecret: '', callbackUrl: '' },
    rateLimit: { windowMs: 900000, max: 100 },
    footballData: { apiKey: 'test-api-key' },
    webPush: { publicKey: '', privateKey: '', subject: 'mailto:test@test.com' },
    socket: { scrapeIntervalMs: 30000 },
    redis: { host: 'localhost', port: 6379, password: '' },
    scraper: { proxyUrl: '', minDelayMs: 300, maxDelayMs: 800, cacheTtlMs: 25000, timeoutMs: 15000, maxRetries: 2 },
  },
}));
jest.mock('../../services/web-push.service', () => ({
  WebPushService: { sendToUser: jest.fn().mockResolvedValue(undefined), sendToUsers: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));
jest.mock('../../models/proposal.model');
jest.mock('../../models/vote.model');
jest.mock('../../models/group.model');
jest.mock('../../models/jornada.model');
jest.mock('../../models/match.model');
jest.mock('../../services/notification.service');
jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { ProposalService } from '../../services/proposal.service';
import { ProposalModel } from '../../models/proposal.model';
import { VoteModel } from '../../models/vote.model';
import { GroupModel } from '../../models/group.model';
import { JornadaModel } from '../../models/jornada.model';
import { MatchModel } from '../../models/match.model';
import { withTransaction } from '../../config/database';

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Test data ────────────────────────────────────────────────────────────────

const openJornada = {
  id: 1, name: 'Jornada 1', status: 'open', deadline: new Date('2099-12-31'),
};
const closedJornada = {
  id: 2, name: 'Jornada 2', status: 'closed', deadline: new Date('2099-12-31'),
};
const expiredJornada = {
  id: 3, name: 'Jornada 3', status: 'open', deadline: new Date('2020-01-01'),
};

const draftProposal = {
  id: 100, group_id: 10, jornada_id: 1, proposed_by: 5, status: 'draft',
  title: 'Mi quiniela', votes_for: 0, votes_against: 0, total_members_at_creation: 4,
};
const pendingProposal = {
  ...draftProposal, id: 101, status: 'pending',
};
const approvedProposal = {
  ...draftProposal, id: 102, status: 'approved',
};

const createDto = {
  jornada_id: 1,
  title: 'Mi quiniela',
  predictions: [
    { match_id: 10, prediction_1x2: '1' as const },
    { match_id: 11, prediction_1x2: 'X' as const },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

describe('ProposalService', () => {
  // ── createProposal ────────────────────────────────────────────────────

  describe('createProposal', () => {
    it('creates proposal successfully', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ProposalModel.findApprovedByGroupAndJornada as jest.Mock).mockResolvedValue(null);
      (MatchModel.findByJornada as jest.Mock).mockResolvedValue([{ id: 10 }, { id: 11 }]);
      (GroupModel.getMemberCount as jest.Mock).mockResolvedValue(4);
      (ProposalModel.create as jest.Mock).mockResolvedValue(100);
      (ProposalModel.addPredictions as jest.Mock).mockResolvedValue(undefined);
      (ProposalModel.getWithDetails as jest.Mock).mockResolvedValue({ ...draftProposal, predictions: [] });

      const result = await ProposalService.createProposal(10, 5, createDto);
      expect(ProposalModel.create).toHaveBeenCalledWith(10, 1, 5, 'Mi quiniela', 4);
      expect(ProposalModel.addPredictions).toHaveBeenCalledWith(100, createDto.predictions);
      expect(result!.id).toBe(100);
    });

    it('throws when jornada not found', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(ProposalService.createProposal(10, 5, createDto)).rejects.toThrow('Jornada not found');
    });

    it('throws when jornada is not open', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(closedJornada);

      await expect(ProposalService.createProposal(10, 5, createDto)).rejects.toThrow('Jornada is not open for proposals');
    });

    it('throws when deadline has passed', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(expiredJornada);

      await expect(ProposalService.createProposal(10, 5, createDto)).rejects.toThrow('El plazo para esta jornada ha finalizado');
    });

    it('throws when group already has approved proposal', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ProposalModel.findApprovedByGroupAndJornada as jest.Mock).mockResolvedValue(approvedProposal);

      await expect(ProposalService.createProposal(10, 5, createDto)).rejects.toThrow('ya tiene una quiniela aprobada');
    });

    it('throws when match id is invalid', async () => {
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ProposalModel.findApprovedByGroupAndJornada as jest.Mock).mockResolvedValue(null);
      (MatchModel.findByJornada as jest.Mock).mockResolvedValue([{ id: 10 }]); // missing id 11

      await expect(ProposalService.createProposal(10, 5, createDto)).rejects.toThrow('Match 11 does not belong to this jornada');
    });
  });

  // ── getProposals ──────────────────────────────────────────────────────

  describe('getProposals', () => {
    it('returns paginated result', async () => {
      (ProposalModel.findByGroup as jest.Mock).mockResolvedValue({ items: [draftProposal], total: 1 });

      const result = await ProposalService.getProposals(10, 1, 20);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  // ── getProposalDetail ─────────────────────────────────────────────────

  describe('getProposalDetail', () => {
    it('delegates to ProposalModel.getWithDetails', async () => {
      (ProposalModel.getWithDetails as jest.Mock).mockResolvedValue(draftProposal);

      const result = await ProposalService.getProposalDetail(100, 5);
      expect(ProposalModel.getWithDetails).toHaveBeenCalledWith(100, 5);
      expect(result).toEqual(draftProposal);
    });
  });

  // ── updateProposal ────────────────────────────────────────────────────

  describe('updateProposal', () => {
    it('updates successfully', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ProposalModel.updateTitle as jest.Mock).mockResolvedValue(undefined);
      (ProposalModel.getWithDetails as jest.Mock).mockResolvedValue({ ...draftProposal, title: 'Updated' });

      const result = await ProposalService.updateProposal(100, 5, { title: 'Updated' });
      expect(ProposalModel.updateTitle).toHaveBeenCalledWith(100, 'Updated');
      expect(result!.title).toBe('Updated');
    });

    it('throws when proposal not found', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(ProposalService.updateProposal(999, 5, { title: 'X' })).rejects.toThrow('Proposal not found');
    });

    it('throws when user is not the proposer', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);

      await expect(ProposalService.updateProposal(100, 99, { title: 'X' })).rejects.toThrow('Only the proposer can edit');
    });

    it('throws when proposal is not draft', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(pendingProposal);

      await expect(ProposalService.updateProposal(101, 5, { title: 'X' })).rejects.toThrow('Only draft proposals can be edited');
    });

    it('throws when deadline has passed', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);
      (JornadaModel.findById as jest.Mock).mockResolvedValue(expiredJornada);

      await expect(ProposalService.updateProposal(100, 5, { title: 'X' })).rejects.toThrow('El plazo para esta jornada ha finalizado');
    });
  });

  // ── submitForVoting ───────────────────────────────────────────────────

  describe('submitForVoting', () => {
    it('sets status to pending when group has multiple members', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ProposalModel.findActiveByGroupAndJornada as jest.Mock).mockResolvedValue(null);
      (GroupModel.getMemberCount as jest.Mock).mockResolvedValue(4);
      (ProposalModel.updateStatus as jest.Mock).mockResolvedValue(undefined);
      (ProposalModel.getWithDetails as jest.Mock).mockResolvedValue({ ...draftProposal, status: 'pending' });
      (GroupModel.getMembers as jest.Mock).mockResolvedValue([]);

      const result = await ProposalService.submitForVoting(100, 5);
      expect(ProposalModel.updateStatus).toHaveBeenCalledWith(100, 'pending');
      expect(result!.status).toBe('pending');
    });

    it('auto-approves when group has 1 member', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ProposalModel.findActiveByGroupAndJornada as jest.Mock).mockResolvedValue(null);
      (GroupModel.getMemberCount as jest.Mock).mockResolvedValue(1);
      (ProposalModel.updateStatus as jest.Mock).mockResolvedValue(undefined);
      (ProposalModel.getWithDetails as jest.Mock).mockResolvedValue({ ...draftProposal, status: 'approved' });

      const result = await ProposalService.submitForVoting(100, 5);
      expect(ProposalModel.updateStatus).toHaveBeenCalledWith(100, 'approved');
      expect(result!.status).toBe('approved');
    });

    it('throws when proposal not found', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(ProposalService.submitForVoting(999, 5)).rejects.toThrow('Proposal not found');
    });

    it('throws when user is not the proposer', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);

      await expect(ProposalService.submitForVoting(100, 99)).rejects.toThrow('Only the proposer can submit');
    });

    it('throws when proposal is not draft', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(pendingProposal);

      await expect(ProposalService.submitForVoting(101, 5)).rejects.toThrow('Only draft proposals can be submitted');
    });

    it('throws when deadline has passed', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);
      (JornadaModel.findById as jest.Mock).mockResolvedValue(expiredJornada);

      await expect(ProposalService.submitForVoting(100, 5)).rejects.toThrow('El plazo para esta jornada ha finalizado');
    });

    it('throws when another active proposal exists', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);
      (JornadaModel.findById as jest.Mock).mockResolvedValue(openJornada);
      (ProposalModel.findActiveByGroupAndJornada as jest.Mock).mockResolvedValue({ ...pendingProposal, status: 'approved' });

      await expect(ProposalService.submitForVoting(100, 5)).rejects.toThrow('ya tiene una quiniela aprobada');
    });
  });

  // ── vote ──────────────────────────────────────────────────────────────

  describe('vote', () => {
    beforeEach(() => {
      // Default: withTransaction executes the callback with a mock connection
      const mockConn = {
        execute: jest.fn().mockResolvedValue([[{ votesFor: 1, votesAgainst: 0 }], []]),
      };
      (withTransaction as jest.Mock).mockImplementation((cb: any) => cb(mockConn));
    });

    it('records an approve vote successfully', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(pendingProposal);
      (GroupModel.isMember as jest.Mock).mockResolvedValue(true);
      (VoteModel.findByProposalAndUser as jest.Mock).mockResolvedValue(null);
      (ProposalModel.getWithDetails as jest.Mock).mockResolvedValue({ ...pendingProposal, votes_for: 1 });

      const result = await ProposalService.vote(101, 7, 'approve');
      expect(withTransaction).toHaveBeenCalled();
      expect(result!.votes_for).toBe(1);
    });

    it('records a reject vote successfully', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(pendingProposal);
      (GroupModel.isMember as jest.Mock).mockResolvedValue(true);
      (VoteModel.findByProposalAndUser as jest.Mock).mockResolvedValue(null);
      (ProposalModel.getWithDetails as jest.Mock).mockResolvedValue({ ...pendingProposal, votes_against: 1 });

      const result = await ProposalService.vote(101, 7, 'reject');
      expect(result!.votes_against).toBe(1);
    });

    it('throws when proposal is not pending', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);

      await expect(ProposalService.vote(100, 7, 'approve')).rejects.toThrow('not open for voting');
    });

    it('throws when user is not a group member', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(pendingProposal);
      (GroupModel.isMember as jest.Mock).mockResolvedValue(false);

      await expect(ProposalService.vote(101, 7, 'approve')).rejects.toThrow('not a member');
    });

    it('throws when user already voted', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(pendingProposal);
      (GroupModel.isMember as jest.Mock).mockResolvedValue(true);
      (VoteModel.findByProposalAndUser as jest.Mock).mockResolvedValue({ id: 1, vote: 'approve' });

      await expect(ProposalService.vote(101, 7, 'approve')).rejects.toThrow('already voted');
    });

    it('approves proposal when majority votes approve', async () => {
      const proposal = { ...pendingProposal, total_members_at_creation: 3 };
      (ProposalModel.findById as jest.Mock).mockResolvedValue(proposal);
      (GroupModel.isMember as jest.Mock).mockResolvedValue(true);
      (VoteModel.findByProposalAndUser as jest.Mock).mockResolvedValue(null);

      const mockConn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[], []]) // INSERT vote
          .mockResolvedValueOnce([[{ votesFor: 2, votesAgainst: 0 }], []]) // SELECT counts
          .mockResolvedValueOnce([[], []]) // UPDATE vote counts
          .mockResolvedValueOnce([[], []]), // UPDATE status to approved
      };
      (withTransaction as jest.Mock).mockImplementation((cb: any) => cb(mockConn));
      (ProposalModel.getWithDetails as jest.Mock).mockResolvedValue({ ...proposal, status: 'approved', votes_for: 2 });

      const result = await ProposalService.vote(101, 7, 'approve');
      expect(result!.status).toBe('approved');
      // Verify the approved status update was called
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining("status = 'approved'"),
        [101],
      );
    });

    it('rejects proposal when majority votes reject', async () => {
      const proposal = { ...pendingProposal, total_members_at_creation: 3 };
      (ProposalModel.findById as jest.Mock).mockResolvedValue(proposal);
      (GroupModel.isMember as jest.Mock).mockResolvedValue(true);
      (VoteModel.findByProposalAndUser as jest.Mock).mockResolvedValue(null);

      const mockConn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[], []]) // INSERT vote
          .mockResolvedValueOnce([[{ votesFor: 0, votesAgainst: 2 }], []]) // SELECT counts
          .mockResolvedValueOnce([[], []]) // UPDATE vote counts
          .mockResolvedValueOnce([[], []]), // UPDATE status to rejected
      };
      (withTransaction as jest.Mock).mockImplementation((cb: any) => cb(mockConn));
      (ProposalModel.getWithDetails as jest.Mock).mockResolvedValue({ ...proposal, status: 'rejected', votes_against: 2 });

      const result = await ProposalService.vote(101, 7, 'reject');
      expect(result!.status).toBe('rejected');
      expect(mockConn.execute).toHaveBeenCalledWith(
        expect.stringContaining("status = 'rejected'"),
        [101],
      );
    });
  });

  // ── deleteProposal ────────────────────────────────────────────────────

  describe('deleteProposal', () => {
    it('deletes successfully', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);
      (ProposalModel.delete as jest.Mock).mockResolvedValue(undefined);

      await ProposalService.deleteProposal(100, 5);
      expect(ProposalModel.delete).toHaveBeenCalledWith(100);
    });

    it('throws when proposal not found', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(ProposalService.deleteProposal(999, 5)).rejects.toThrow('Proposal not found');
    });

    it('throws when user is not the proposer', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(draftProposal);

      await expect(ProposalService.deleteProposal(100, 99)).rejects.toThrow('Only the proposer can delete');
    });

    it('throws when proposal is approved', async () => {
      (ProposalModel.findById as jest.Mock).mockResolvedValue(approvedProposal);

      await expect(ProposalService.deleteProposal(102, 5)).rejects.toThrow('Cannot delete an approved proposal');
    });
  });
});
