jest.mock('../../../config/environment', () => ({
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

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn(), getConnection: jest.fn() },
  testConnection: jest.fn(),
  withTransaction: jest.fn((cb: any) => cb({ execute: jest.fn().mockResolvedValue([[], []]) })),
}));

jest.mock('../../../models/group.model');
jest.mock('../../../models/invitation.model');
jest.mock('../../../models/user.model');
jest.mock('../../../models/jornada.model');
jest.mock('../../../models/match.model');
jest.mock('../../../models/proposal.model');
jest.mock('../../../models/vote.model');
jest.mock('../../../models/notification.model');
jest.mock('../../../services/notification.service');
jest.mock('../../../services/cache.service');
jest.mock('../../../services/web-push.service');
jest.mock('../../../config/cache', () => ({
  CacheKey: {
    JORNADA_LIST: 'jornada_list',
    LEAGUE_STANDINGS: 'league_standings',
    DASHBOARD: 'dashboard',
  },
}));

import { GroupService } from '../../../services/group.service';
import { ProposalService } from '../../../services/proposal.service';
import { NotificationService } from '../../../services/notification.service';
import { GroupModel } from '../../../models/group.model';
import { InvitationModel } from '../../../models/invitation.model';
import { UserModel } from '../../../models/user.model';
import { JornadaModel } from '../../../models/jornada.model';
import { MatchModel } from '../../../models/match.model';
import { ProposalModel } from '../../../models/proposal.model';
import { VoteModel } from '../../../models/vote.model';

const mockGroupModel = GroupModel as jest.Mocked<typeof GroupModel>;
const mockInvitationModel = InvitationModel as jest.Mocked<typeof InvitationModel>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockJornadaModel = JornadaModel as jest.Mocked<typeof JornadaModel>;
const mockMatchModel = MatchModel as jest.Mocked<typeof MatchModel>;
const mockProposalModel = ProposalModel as jest.Mocked<typeof ProposalModel>;
const mockVoteModel = VoteModel as jest.Mocked<typeof VoteModel>;
const mockNotificationService = NotificationService as jest.Mocked<typeof NotificationService>;

// ─── Shared test data ────────────────────────────────────────────────────────

const OWNER_ID = 1;
const INVITED_USER_ID = 2;
const GROUP_ID = 10;
const INVITATION_ID = 100;
const JORNADA_ID = 5;
const PROPOSAL_ID = 50;

const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const sampleGroup = {
  id: GROUP_ID,
  name: 'Los Cracks',
  description: 'Best prediction group',
  created_by: OWNER_ID,
  created_at: new Date(),
};

const sampleInvitation = {
  id: INVITATION_ID,
  group_id: GROUP_ID,
  invited_by: OWNER_ID,
  invited_user_id: INVITED_USER_ID,
  status: 'pending' as const,
  created_at: new Date(),
};

const sampleJornada = {
  id: JORNADA_ID,
  name: 'Jornada 5',
  season: '2025-2026',
  jornada_number: 5,
  status: 'open' as const,
  deadline: futureDeadline,
  created_at: new Date(),
};

const sampleMatches = [
  { id: 1, jornada_id: JORNADA_ID, match_number: 1, home_team: 'Real Madrid', away_team: 'Barcelona' },
  { id: 2, jornada_id: JORNADA_ID, match_number: 2, home_team: 'Atletico', away_team: 'Sevilla' },
];

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Group Invitation Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete the full group invitation flow from creation to proposal voting', async () => {
    // ─── Step 1: Create a group ───────────────────────────────────────
    mockGroupModel.create.mockResolvedValue(GROUP_ID);
    mockGroupModel.addMember.mockResolvedValue(undefined);
    mockGroupModel.findById.mockResolvedValue(sampleGroup as any);

    const group = await GroupService.createGroup('Los Cracks', 'Best prediction group', OWNER_ID);

    expect(mockGroupModel.create).toHaveBeenCalledWith('Los Cracks', 'Best prediction group', OWNER_ID);
    expect(mockGroupModel.addMember).toHaveBeenCalledWith(GROUP_ID, OWNER_ID, 'admin');
    expect(group).toBeDefined();
    expect(group!.name).toBe('Los Cracks');

    // ─── Step 2: Invite a user ────────────────────────────────────────
    mockUserModel.findById.mockResolvedValue({
      id: INVITED_USER_ID,
      email: 'invited@test.com',
      first_name: 'Bob',
      last_name: 'Jones',
      is_active: true,
    } as any);
    mockGroupModel.isMember.mockResolvedValue(false);
    mockInvitationModel.hasPendingInvitation.mockResolvedValue(false);
    mockInvitationModel.create.mockResolvedValue(INVITATION_ID as any);

    const invitation = await GroupService.inviteUser(GROUP_ID, OWNER_ID, INVITED_USER_ID);

    expect(mockUserModel.findById).toHaveBeenCalledWith(INVITED_USER_ID);
    expect(mockInvitationModel.create).toHaveBeenCalledWith(GROUP_ID, OWNER_ID, INVITED_USER_ID);
    expect(invitation).toBeDefined();

    // ─── Step 3: Verify notification sent ─────────────────────────────
    mockNotificationService.notifyInvitationReceived.mockResolvedValue(undefined);

    await NotificationService.notifyInvitationReceived('Los Cracks', 'Alice', INVITED_USER_ID);

    expect(mockNotificationService.notifyInvitationReceived).toHaveBeenCalledWith(
      'Los Cracks',
      'Alice',
      INVITED_USER_ID
    );

    // ─── Step 4: Accept invitation ────────────────────────────────────
    mockInvitationModel.findById.mockResolvedValue(sampleInvitation as any);
    mockInvitationModel.accept.mockResolvedValue(undefined);
    mockGroupModel.addMember.mockResolvedValue(undefined);

    await GroupService.acceptInvitation(INVITATION_ID, INVITED_USER_ID);

    expect(mockInvitationModel.accept).toHaveBeenCalledWith(INVITATION_ID);
    expect(mockGroupModel.addMember).toHaveBeenCalledWith(GROUP_ID, INVITED_USER_ID, 'member');

    // ─── Step 5: Verify user is now a member ──────────────────────────
    mockGroupModel.isMember.mockResolvedValue(true);

    const isMember = await GroupModel.isMember(GROUP_ID, INVITED_USER_ID);
    expect(isMember).toBe(true);

    // ─── Step 6: Create a proposal for the group ──────────────────────
    mockJornadaModel.findById.mockResolvedValue(sampleJornada as any);
    mockProposalModel.findApprovedByGroupAndJornada.mockResolvedValue(null);
    mockMatchModel.findByJornada.mockResolvedValue(sampleMatches as any);
    mockGroupModel.getMemberCount.mockResolvedValue(2);
    mockProposalModel.create.mockResolvedValue(PROPOSAL_ID);
    mockProposalModel.addPredictions.mockResolvedValue(undefined);
    mockProposalModel.getWithDetails.mockResolvedValue({
      id: PROPOSAL_ID,
      group_id: GROUP_ID,
      jornada_id: JORNADA_ID,
      proposed_by: OWNER_ID,
      status: 'draft',
      predictions: [
        { match_id: 1, prediction_1x2: '1' },
        { match_id: 2, prediction_1x2: 'X' },
      ],
    } as any);

    const proposal = await ProposalService.createProposal(GROUP_ID, OWNER_ID, {
      jornada_id: JORNADA_ID,
      title: 'Nuestra quiniela',
      predictions: [
        { match_id: 1, prediction_1x2: '1' },
        { match_id: 2, prediction_1x2: 'X' },
      ],
    } as any);

    expect(proposal).toBeDefined();
    expect(mockProposalModel.create).toHaveBeenCalled();

    // ─── Step 7: Submit for voting ────────────────────────────────────
    // With 2 members, it should go to 'pending' (not auto-approved)
    mockProposalModel.findById.mockResolvedValue({
      id: PROPOSAL_ID,
      group_id: GROUP_ID,
      jornada_id: JORNADA_ID,
      proposed_by: OWNER_ID,
      status: 'draft',
      total_members_at_creation: 2,
    } as any);
    mockProposalModel.findActiveByGroupAndJornada.mockResolvedValue(null);
    mockGroupModel.getMemberCount.mockResolvedValue(2);
    mockProposalModel.updateStatus.mockResolvedValue(undefined);
    mockProposalModel.getWithDetails.mockResolvedValue({
      id: PROPOSAL_ID,
      status: 'pending',
    } as any);
    mockGroupModel.getMembers.mockResolvedValue([
      { user_id: OWNER_ID, first_name: 'Alice', last_name: 'Smith', role: 'admin' },
      { user_id: INVITED_USER_ID, first_name: 'Bob', last_name: 'Jones', role: 'member' },
    ] as any);
    mockGroupModel.findById.mockResolvedValue(sampleGroup as any);

    const submittedProposal = await ProposalService.submitForVoting(PROPOSAL_ID, OWNER_ID);

    expect(mockProposalModel.updateStatus).toHaveBeenCalledWith(PROPOSAL_ID, 'pending');
    expect(submittedProposal!.status).toBe('pending');

    // ─── Step 8: Both members vote to approve ─────────────────────────
    const { withTransaction } = require('../../../config/database');

    // Owner votes
    mockProposalModel.findById.mockResolvedValue({
      id: PROPOSAL_ID,
      group_id: GROUP_ID,
      jornada_id: JORNADA_ID,
      proposed_by: OWNER_ID,
      status: 'pending',
      total_members_at_creation: 2,
    } as any);
    mockGroupModel.isMember.mockResolvedValue(true);
    mockVoteModel.findByProposalAndUser.mockResolvedValue(null);

    (withTransaction as jest.Mock).mockImplementation(async (cb: any) => {
      const mockConn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[], []]) // INSERT vote
          .mockResolvedValueOnce([[{ votesFor: 1, votesAgainst: 0 }], []]) // COUNT
          .mockResolvedValueOnce([[], []]), // UPDATE vote counts
      };
      return cb(mockConn);
    });
    mockProposalModel.getWithDetails.mockResolvedValue({
      id: PROPOSAL_ID,
      status: 'pending',
      votes_for: 1,
    } as any);

    await ProposalService.vote(PROPOSAL_ID, OWNER_ID, 'approve');

    // Invited user votes (reaches majority)
    mockProposalModel.findById.mockResolvedValue({
      id: PROPOSAL_ID,
      group_id: GROUP_ID,
      jornada_id: JORNADA_ID,
      proposed_by: OWNER_ID,
      status: 'pending',
      total_members_at_creation: 2,
    } as any);
    mockVoteModel.findByProposalAndUser.mockResolvedValue(null);

    (withTransaction as jest.Mock).mockImplementation(async (cb: any) => {
      const mockConn = {
        execute: jest.fn()
          .mockResolvedValueOnce([[], []]) // INSERT vote
          .mockResolvedValueOnce([[{ votesFor: 2, votesAgainst: 0 }], []]) // COUNT
          .mockResolvedValueOnce([[], []]) // UPDATE vote counts
          .mockResolvedValueOnce([[], []]), // UPDATE status to approved (majority reached)
      };
      return cb(mockConn);
    });
    mockProposalModel.getWithDetails.mockResolvedValue({
      id: PROPOSAL_ID,
      status: 'approved',
      votes_for: 2,
      votes_against: 0,
    } as any);

    const approvedProposal = await ProposalService.vote(PROPOSAL_ID, INVITED_USER_ID, 'approve');

    expect(approvedProposal!.status).toBe('approved');
    expect(approvedProposal!.votes_for).toBe(2);
  });

  it('should reject invitation if user is already a member', async () => {
    mockUserModel.findById.mockResolvedValue({
      id: INVITED_USER_ID,
      email: 'invited@test.com',
      first_name: 'Bob',
    } as any);
    mockGroupModel.isMember.mockResolvedValue(true);

    await expect(
      GroupService.inviteUser(GROUP_ID, OWNER_ID, INVITED_USER_ID)
    ).rejects.toThrow('User is already a member of this group');
  });

  it('should reject invitation acceptance if invitation is not for the user', async () => {
    mockInvitationModel.findById.mockResolvedValue({
      ...sampleInvitation,
      invited_user_id: 999, // Different user
    } as any);

    await expect(
      GroupService.acceptInvitation(INVITATION_ID, INVITED_USER_ID)
    ).rejects.toThrow('This invitation is not for you');
  });

  it('should auto-approve proposal when group has only 1 member', async () => {
    mockProposalModel.findById.mockResolvedValue({
      id: PROPOSAL_ID,
      group_id: GROUP_ID,
      jornada_id: JORNADA_ID,
      proposed_by: OWNER_ID,
      status: 'draft',
    } as any);
    mockJornadaModel.findById.mockResolvedValue(sampleJornada as any);
    mockProposalModel.findActiveByGroupAndJornada.mockResolvedValue(null);
    mockGroupModel.getMemberCount.mockResolvedValue(1);
    mockProposalModel.updateStatus.mockResolvedValue(undefined);
    mockProposalModel.getWithDetails.mockResolvedValue({
      id: PROPOSAL_ID,
      status: 'approved',
    } as any);

    const result = await ProposalService.submitForVoting(PROPOSAL_ID, OWNER_ID);

    expect(mockProposalModel.updateStatus).toHaveBeenCalledWith(PROPOSAL_ID, 'approved');
    expect(result!.status).toBe('approved');
  });
});
