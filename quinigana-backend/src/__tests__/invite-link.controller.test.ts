import { Request, Response } from 'express';
import { InviteLinkController } from '../controllers/invite-link.controller';
import { InviteLinkModel } from '../models/invite-link.model';
import { GroupModel } from '../models/group.model';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: { execute: jest.fn(), query: jest.fn() },
  testConnection: jest.fn(),
}));
jest.mock('../models/invite-link.model');
jest.mock('../models/group.model');
jest.mock('../config/environment', () => ({
  env: { nodeEnv: 'test' },
}));

function mockRes(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(params: any = {}, authUser: any = { userId: 1 }): Request {
  return { params, authUser } as unknown as Request;
}

describe('InviteLinkController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate invite link for group admin', async () => {
      (GroupModel.isAdmin as jest.Mock).mockResolvedValue(true);
      (InviteLinkModel.create as jest.Mock).mockResolvedValue({
        token: 'abc123',
        expires_at: '2026-02-01T00:00:00.000Z',
      });

      const req = mockReq({ id: '5' });
      const res = mockRes();

      await InviteLinkController.generate(req, res);

      expect(GroupModel.isAdmin).toHaveBeenCalledWith(5, 1);
      expect(InviteLinkModel.create).toHaveBeenCalledWith(5, 1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { token: 'abc123', expiresAt: '2026-02-01T00:00:00.000Z' },
      }));
    });

    it('should reject non-admin users', async () => {
      (GroupModel.isAdmin as jest.Mock).mockResolvedValue(false);

      const req = mockReq({ id: '5' });
      const res = mockRes();

      await InviteLinkController.generate(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'NOT_ADMIN' }),
      }));
    });

    it('should reject invalid group id', async () => {
      const req = mockReq({ id: 'invalid' });
      const res = mockRes();

      await InviteLinkController.generate(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'INVITE_LINK_ERROR' }),
      }));
    });
  });

  describe('getInfo', () => {
    it('should return group info for valid token', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      (InviteLinkModel.findByToken as jest.Mock).mockResolvedValue({
        group_id: 3,
        expires_at: futureDate,
        max_uses: 0,
        use_count: 0,
      });
      (GroupModel.findById as jest.Mock).mockResolvedValue({ name: 'Test Group', description: 'A group' });
      (GroupModel.getMembers as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const req = mockReq({ token: 'valid-token' });
      const res = mockRes();

      await InviteLinkController.getInfo(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          groupName: 'Test Group',
          memberCount: 2,
        }),
      }));
    });

    it('should return 404 for unknown token', async () => {
      (InviteLinkModel.findByToken as jest.Mock).mockResolvedValue(null);

      const req = mockReq({ token: 'unknown' });
      const res = mockRes();

      await InviteLinkController.getInfo(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'LINK_NOT_FOUND' }),
      }));
    });

    it('should return 410 for expired token', async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      (InviteLinkModel.findByToken as jest.Mock).mockResolvedValue({
        group_id: 3,
        expires_at: pastDate,
        max_uses: 0,
        use_count: 0,
      });

      const req = mockReq({ token: 'expired-token' });
      const res = mockRes();

      await InviteLinkController.getInfo(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'LINK_EXPIRED' }),
      }));
    });

    it('should return 410 for exhausted link', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      (InviteLinkModel.findByToken as jest.Mock).mockResolvedValue({
        group_id: 3,
        expires_at: futureDate,
        max_uses: 5,
        use_count: 5,
      });

      const req = mockReq({ token: 'exhausted-token' });
      const res = mockRes();

      await InviteLinkController.getInfo(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'LINK_EXHAUSTED' }),
      }));
    });
  });

  describe('accept', () => {
    it('should allow user to join group via valid link', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      (InviteLinkModel.findByToken as jest.Mock).mockResolvedValue({
        id: 10,
        group_id: 3,
        expires_at: futureDate,
        max_uses: 0,
        use_count: 0,
      });
      (GroupModel.isMember as jest.Mock).mockResolvedValue(false);
      (GroupModel.addMember as jest.Mock).mockResolvedValue(undefined);
      (InviteLinkModel.incrementUseCount as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq({ token: 'valid' });
      const res = mockRes();

      await InviteLinkController.accept(req, res);

      expect(GroupModel.addMember).toHaveBeenCalledWith(3, 1, 'member');
      expect(InviteLinkModel.incrementUseCount).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { groupId: 3 },
      }));
    });

    it('should reject if user is already a member', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      (InviteLinkModel.findByToken as jest.Mock).mockResolvedValue({
        id: 10,
        group_id: 3,
        expires_at: futureDate,
        max_uses: 0,
        use_count: 0,
      });
      (GroupModel.isMember as jest.Mock).mockResolvedValue(true);

      const req = mockReq({ token: 'valid' });
      const res = mockRes();

      await InviteLinkController.accept(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'ALREADY_MEMBER' }),
      }));
    });
  });
});
