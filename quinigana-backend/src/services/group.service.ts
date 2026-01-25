import { GroupModel } from '../models/group.model';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import { InvitationModel } from '../models/invitation.model';
import { UserModel } from '../models/user.model';

export class GroupService {
  static async createGroup(name: string, description: string | null, userId: number) {
    const groupId = await GroupModel.create(name, description, userId);
    await GroupModel.addMember(groupId, userId, 'admin');
    return GroupModel.findById(groupId);
  }

  static async getMyGroups(userId: number) {
    return GroupModel.findByUser(userId);
  }

  static async getGroupDetail(groupId: number) {
    return GroupModel.findById(groupId);
  }

  static async updateGroup(groupId: number, data: { name?: string; description?: string }) {
    await GroupModel.update(groupId, data);
    return GroupModel.findById(groupId);
  }

  static async deleteGroup(groupId: number) {
    await GroupModel.delete(groupId);
  }

  static async getMembers(groupId: number) {
    return GroupModel.getMembers(groupId);
  }

  static async removeMember(groupId: number, userId: number) {
    const member = await GroupModel.getMember(groupId, userId);
    if (!member) {
      throw new Error('User is not a member of this group');
    }
    if (member.role === 'admin') {
      throw new Error('Cannot remove a group admin');
    }
    await GroupModel.removeMember(groupId, userId);
  }

  static async leaveGroup(groupId: number, userId: number) {
    const member = await GroupModel.getMember(groupId, userId);
    if (!member) {
      throw new Error('You are not a member of this group');
    }
    if (member.role === 'admin') {
      const members = await GroupModel.getMembers(groupId);
      const admins = members.filter(m => m.role === 'admin');
      if (admins.length <= 1) {
        throw new Error('Cannot leave group as the only admin. Transfer admin role first or delete the group.');
      }
    }
    await GroupModel.removeMember(groupId, userId);
  }

  static async inviteUser(groupId: number, invitedBy: number, invitedUserId: number) {
    const user = await UserModel.findById(invitedUserId);
    if (!user) {
      throw new Error('User not found');
    }

    const isMember = await GroupModel.isMember(groupId, invitedUserId);
    if (isMember) {
      throw new Error('User is already a member of this group');
    }

    const hasPending = await InvitationModel.hasPendingInvitation(groupId, invitedUserId);
    if (hasPending) {
      throw new Error('User already has a pending invitation');
    }

    return InvitationModel.create(groupId, invitedBy, invitedUserId);
  }

  static async getPendingInvitations(userId: number) {
    return InvitationModel.findPendingByUser(userId);
  }

  static async acceptInvitation(invitationId: number, userId: number) {
    const invitation = await InvitationModel.findById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    if (invitation.invited_user_id !== userId) {
      throw new Error('This invitation is not for you');
    }
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer pending');
    }

    await InvitationModel.accept(invitationId);
    await GroupModel.addMember(invitation.group_id, userId, 'member');
  }

  static async rejectInvitation(invitationId: number, userId: number) {
    const invitation = await InvitationModel.findById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    if (invitation.invited_user_id !== userId) {
      throw new Error('This invitation is not for you');
    }
    if (invitation.status !== 'pending') {
      throw new Error('Invitation is no longer pending');
    }

    await InvitationModel.reject(invitationId);
  }

  static async searchUsers(query: string, currentUserId: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, email, first_name, last_name, avatar_url
       FROM users
       WHERE (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
         AND id != ? AND is_active = TRUE
       LIMIT 20`,
      [`%${query}%`, `%${query}%`, `%${query}%`, currentUserId]
    );
    return rows;
  }
}
