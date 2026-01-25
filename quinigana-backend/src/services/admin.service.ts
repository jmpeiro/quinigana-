import { AdminModel } from '../models/admin.model';
import { PaginatedResponse, UserAdmin, GlobalStats, GroupAdmin } from '../types';

export class AdminService {
  static async getUsers(page: number, limit: number, search?: string): Promise<PaginatedResponse<UserAdmin>> {
    const { users, total } = await AdminModel.getAllUsers(page, limit, search);
    return {
      items: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async toggleAdmin(userId: number): Promise<boolean> {
    return AdminModel.toggleAdmin(userId);
  }

  static async toggleUserActive(userId: number): Promise<boolean> {
    return AdminModel.toggleUserActive(userId);
  }

  static async getGlobalStats(): Promise<GlobalStats> {
    return AdminModel.getGlobalStats();
  }

  static async getAllGroups(page: number, limit: number, search?: string): Promise<PaginatedResponse<GroupAdmin>> {
    const { groups, total } = await AdminModel.getAllGroups(page, limit, search);
    return {
      items: groups,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async deactivateGroup(groupId: number): Promise<void> {
    await AdminModel.deactivateGroup(groupId);
  }

  static async updateMatch(matchId: number, data: { home_team?: string; away_team?: string; match_date?: string }): Promise<void> {
    await AdminModel.updateMatch(matchId, data);
  }

  static async reopenJornada(jornadaId: number): Promise<void> {
    await AdminModel.reopenJornada(jornadaId);
  }
}
