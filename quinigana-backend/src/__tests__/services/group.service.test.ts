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

jest.mock('../../models/group.model');
jest.mock('../../models/invitation.model');
jest.mock('../../models/user.model');

import { GroupService } from '../../services/group.service';
import { GroupModel } from '../../models/group.model';
import { InvitationModel } from '../../models/invitation.model';
import { UserModel } from '../../models/user.model';
import pool from '../../config/database';

const mockGroupModel = GroupModel as jest.Mocked<typeof GroupModel>;
const mockInvitationModel = InvitationModel as jest.Mocked<typeof InvitationModel>;
const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockPool = pool as jest.Mocked<typeof pool>;

describe('GroupService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create group, add creator as admin, and return group', async () => {
      (mockGroupModel.create as jest.Mock).mockResolvedValue(10);
      (mockGroupModel.addMember as jest.Mock).mockResolvedValue(undefined);
      (mockGroupModel.findById as jest.Mock).mockResolvedValue({ id: 10, name: 'Test Group' });

      const result = await GroupService.createGroup('Test Group', 'A description', 1);

      expect(mockGroupModel.create).toHaveBeenCalledWith('Test Group', 'A description', 1);
      expect(mockGroupModel.addMember).toHaveBeenCalledWith(10, 1, 'admin');
      expect(mockGroupModel.findById).toHaveBeenCalledWith(10);
      expect(result).toEqual({ id: 10, name: 'Test Group' });
    });
  });

  describe('getMyGroups', () => {
    it('should delegate to GroupModel.findByUser', async () => {
      const mockGroups = [{ id: 1 }, { id: 2 }];
      (mockGroupModel.findByUser as jest.Mock).mockResolvedValue(mockGroups);

      const result = await GroupService.getMyGroups(1);
      expect(result).toEqual(mockGroups);
      expect(mockGroupModel.findByUser).toHaveBeenCalledWith(1);
    });
  });

  describe('getGroupDetail', () => {
    it('should delegate to GroupModel.findById', async () => {
      (mockGroupModel.findById as jest.Mock).mockResolvedValue({ id: 5 });

      const result = await GroupService.getGroupDetail(5);
      expect(result).toEqual({ id: 5 });
    });
  });

  describe('updateGroup', () => {
    it('should update and return the updated group', async () => {
      (mockGroupModel.update as jest.Mock).mockResolvedValue(undefined);
      (mockGroupModel.findById as jest.Mock).mockResolvedValue({ id: 5, name: 'Updated' });

      const result = await GroupService.updateGroup(5, { name: 'Updated' });
      expect(mockGroupModel.update).toHaveBeenCalledWith(5, { name: 'Updated' });
      expect(result).toEqual({ id: 5, name: 'Updated' });
    });
  });

  describe('deleteGroup', () => {
    it('should delegate to GroupModel.delete', async () => {
      (mockGroupModel.delete as jest.Mock).mockResolvedValue(undefined);

      await GroupService.deleteGroup(5);
      expect(mockGroupModel.delete).toHaveBeenCalledWith(5);
    });
  });

  describe('getMembers', () => {
    it('should delegate to GroupModel.getMembers', async () => {
      const members = [{ user_id: 1, role: 'admin' }];
      (mockGroupModel.getMembers as jest.Mock).mockResolvedValue(members);

      const result = await GroupService.getMembers(5);
      expect(result).toEqual(members);
    });
  });

  describe('removeMember', () => {
    it('should remove a regular member', async () => {
      (mockGroupModel.getMember as jest.Mock).mockResolvedValue({ role: 'member' });
      (mockGroupModel.removeMember as jest.Mock).mockResolvedValue(undefined);

      await GroupService.removeMember(5, 2);
      expect(mockGroupModel.removeMember).toHaveBeenCalledWith(5, 2);
    });

    it('should throw when user is not a member', async () => {
      (mockGroupModel.getMember as jest.Mock).mockResolvedValue(null);

      await expect(GroupService.removeMember(5, 2)).rejects.toThrow('User is not a member of this group');
    });

    it('should throw when trying to remove an admin', async () => {
      (mockGroupModel.getMember as jest.Mock).mockResolvedValue({ role: 'admin' });

      await expect(GroupService.removeMember(5, 2)).rejects.toThrow('Cannot remove a group admin');
    });
  });

  describe('leaveGroup', () => {
    it('should allow a regular member to leave', async () => {
      (mockGroupModel.getMember as jest.Mock).mockResolvedValue({ role: 'member' });
      (mockGroupModel.removeMember as jest.Mock).mockResolvedValue(undefined);

      await GroupService.leaveGroup(5, 2);
      expect(mockGroupModel.removeMember).toHaveBeenCalledWith(5, 2);
    });

    it('should throw when user is not a member', async () => {
      (mockGroupModel.getMember as jest.Mock).mockResolvedValue(null);

      await expect(GroupService.leaveGroup(5, 2)).rejects.toThrow('You are not a member of this group');
    });

    it('should throw when only admin tries to leave', async () => {
      (mockGroupModel.getMember as jest.Mock).mockResolvedValue({ role: 'admin' });
      (mockGroupModel.getMembers as jest.Mock).mockResolvedValue([
        { role: 'admin', user_id: 1 },
        { role: 'member', user_id: 2 },
      ]);

      await expect(GroupService.leaveGroup(5, 1)).rejects.toThrow('Cannot leave group as the only admin');
    });

    it('should allow admin to leave when there are other admins', async () => {
      (mockGroupModel.getMember as jest.Mock).mockResolvedValue({ role: 'admin' });
      (mockGroupModel.getMembers as jest.Mock).mockResolvedValue([
        { role: 'admin', user_id: 1 },
        { role: 'admin', user_id: 3 },
      ]);
      (mockGroupModel.removeMember as jest.Mock).mockResolvedValue(undefined);

      await GroupService.leaveGroup(5, 1);
      expect(mockGroupModel.removeMember).toHaveBeenCalledWith(5, 1);
    });
  });

  describe('inviteUser', () => {
    it('should create invitation when all validations pass', async () => {
      (mockUserModel.findById as jest.Mock).mockResolvedValue({ id: 3 });
      (mockGroupModel.isMember as jest.Mock).mockResolvedValue(false);
      (mockInvitationModel.hasPendingInvitation as jest.Mock).mockResolvedValue(false);
      (mockInvitationModel.create as jest.Mock).mockResolvedValue(1);

      await GroupService.inviteUser(5, 1, 3);

      expect(mockInvitationModel.create).toHaveBeenCalledWith(5, 1, 3);
    });

    it('should throw when user does not exist', async () => {
      (mockUserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(GroupService.inviteUser(5, 1, 999)).rejects.toThrow('User not found');
    });

    it('should throw when user is already a member', async () => {
      (mockUserModel.findById as jest.Mock).mockResolvedValue({ id: 3 });
      (mockGroupModel.isMember as jest.Mock).mockResolvedValue(true);

      await expect(GroupService.inviteUser(5, 1, 3)).rejects.toThrow('User is already a member of this group');
    });

    it('should throw when user already has a pending invitation', async () => {
      (mockUserModel.findById as jest.Mock).mockResolvedValue({ id: 3 });
      (mockGroupModel.isMember as jest.Mock).mockResolvedValue(false);
      (mockInvitationModel.hasPendingInvitation as jest.Mock).mockResolvedValue(true);

      await expect(GroupService.inviteUser(5, 1, 3)).rejects.toThrow('User already has a pending invitation');
    });
  });

  describe('getPendingInvitations', () => {
    it('should delegate to InvitationModel.findPendingByUser', async () => {
      const invitations = [{ id: 1 }];
      (mockInvitationModel.findPendingByUser as jest.Mock).mockResolvedValue(invitations);

      const result = await GroupService.getPendingInvitations(1);
      expect(result).toEqual(invitations);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and add member', async () => {
      (mockInvitationModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        group_id: 5,
        invited_user_id: 3,
        status: 'pending',
      });
      (mockInvitationModel.accept as jest.Mock).mockResolvedValue(undefined);
      (mockGroupModel.addMember as jest.Mock).mockResolvedValue(undefined);

      await GroupService.acceptInvitation(1, 3);

      expect(mockInvitationModel.accept).toHaveBeenCalledWith(1);
      expect(mockGroupModel.addMember).toHaveBeenCalledWith(5, 3, 'member');
    });

    it('should throw when invitation not found', async () => {
      (mockInvitationModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(GroupService.acceptInvitation(999, 3)).rejects.toThrow('Invitation not found');
    });

    it('should throw when invitation belongs to another user', async () => {
      (mockInvitationModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        invited_user_id: 5,
        status: 'pending',
      });

      await expect(GroupService.acceptInvitation(1, 3)).rejects.toThrow('This invitation is not for you');
    });

    it('should throw when invitation is not pending', async () => {
      (mockInvitationModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        invited_user_id: 3,
        status: 'accepted',
      });

      await expect(GroupService.acceptInvitation(1, 3)).rejects.toThrow('Invitation is no longer pending');
    });
  });

  describe('rejectInvitation', () => {
    it('should reject a valid pending invitation', async () => {
      (mockInvitationModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        invited_user_id: 3,
        status: 'pending',
      });
      (mockInvitationModel.reject as jest.Mock).mockResolvedValue(undefined);

      await GroupService.rejectInvitation(1, 3);
      expect(mockInvitationModel.reject).toHaveBeenCalledWith(1);
    });

    it('should throw when invitation not found', async () => {
      (mockInvitationModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(GroupService.rejectInvitation(999, 3)).rejects.toThrow('Invitation not found');
    });

    it('should throw when invitation belongs to another user', async () => {
      (mockInvitationModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        invited_user_id: 5,
        status: 'pending',
      });

      await expect(GroupService.rejectInvitation(1, 3)).rejects.toThrow('This invitation is not for you');
    });

    it('should throw when invitation is not pending', async () => {
      (mockInvitationModel.findById as jest.Mock).mockResolvedValue({
        id: 1,
        invited_user_id: 3,
        status: 'rejected',
      });

      await expect(GroupService.rejectInvitation(1, 3)).rejects.toThrow('Invitation is no longer pending');
    });
  });

  describe('searchUsers', () => {
    it('should query database and return matching users', async () => {
      const mockUsers = [
        { id: 2, email: 'user@test.com', first_name: 'User', last_name: 'Test', avatar_url: null },
      ];
      (mockPool.execute as jest.Mock).mockResolvedValue([mockUsers, []]);

      const result = await GroupService.searchUsers('user', 1);

      expect(mockPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email, first_name, last_name, avatar_url'),
        ['%user%', '%user%', '%user%', 1]
      );
      expect(result).toEqual(mockUsers);
    });
  });
});
