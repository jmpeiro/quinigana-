import { Request, Response } from 'express';
import { GroupService } from '../services/group.service';
import { ActivityModel } from '../models/activity.model';
import { sendSuccess, sendError } from '../utils/response.util';
import { parseId } from '../utils/parse-id.util';

export class GroupController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const { name, description } = req.body;
      const group = await GroupService.createGroup(name, description || null, userId);
      sendSuccess(res, group, 'Group created successfully', 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create group';
      sendError(res, 'CREATE_GROUP_ERROR', message, 500);
    }
  }

  static async getMyGroups(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const groups = await GroupService.getMyGroups(userId);
      sendSuccess(res, groups);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch groups', 500);
    }
  }

  static async getDetail(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const group = await GroupService.getGroupDetail(groupId);
      if (!group) {
        sendError(res, 'GROUP_NOT_FOUND', 'Group not found', 404);
        return;
      }
      sendSuccess(res, group);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch group', 500);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const { name, description } = req.body;
      const group = await GroupService.updateGroup(groupId, { name, description });
      sendSuccess(res, group, 'Group updated');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update group';
      sendError(res, 'UPDATE_GROUP_ERROR', message, 500);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      await GroupService.deleteGroup(groupId);
      sendSuccess(res, null, 'Group deleted');
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to delete group', 500);
    }
  }

  static async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const members = await GroupService.getMembers(groupId);
      sendSuccess(res, members);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch members', 500);
    }
  }

  static async removeMember(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const userId = parseId(req.params.userId);
      await GroupService.removeMember(groupId, userId);
      sendSuccess(res, null, 'Member removed');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      sendError(res, 'REMOVE_MEMBER_ERROR', message, 400);
    }
  }

  static async leave(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const userId = req.authUser!.userId;
      await GroupService.leaveGroup(groupId, userId);
      sendSuccess(res, null, 'Left group successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to leave group';
      sendError(res, 'LEAVE_GROUP_ERROR', message, 400);
    }
  }

  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const userId = req.authUser!.userId;
      const users = await GroupService.searchUsers(query, userId);
      sendSuccess(res, users);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to search users', 500);
    }
  }

  static async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseId(req.params.id);
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const data = await ActivityModel.getGroupActivity(groupId, page, limit);
      sendSuccess(res, data);
    } catch {
      sendError(res, 'INTERNAL_ERROR', 'Failed to fetch activity', 500);
    }
  }
}
