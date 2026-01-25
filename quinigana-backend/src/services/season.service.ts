import { SeasonModel } from '../models/season.model';
import { Season, SeasonWithStats, CreateSeasonDto, UpdateSeasonDto } from '../types';

export class SeasonService {
  static async getAll(): Promise<SeasonWithStats[]> {
    return SeasonModel.getAll();
  }

  static async getById(id: number): Promise<Season | null> {
    return SeasonModel.getById(id);
  }

  static async getCurrent(): Promise<Season | null> {
    return SeasonModel.getCurrent();
  }

  static async create(data: CreateSeasonDto): Promise<number> {
    // Validate dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (endDate <= startDate) {
      throw { code: 'INVALID_DATES', message: 'End date must be after start date', statusCode: 400 };
    }

    // Check if name already exists
    const existing = await SeasonModel.getByName(data.name);
    if (existing) {
      throw { code: 'SEASON_EXISTS', message: 'A season with this name already exists', statusCode: 400 };
    }

    return SeasonModel.create(data);
  }

  static async update(id: number, data: UpdateSeasonDto): Promise<boolean> {
    const season = await SeasonModel.getById(id);
    if (!season) {
      throw { code: 'SEASON_NOT_FOUND', message: 'Season not found', statusCode: 404 };
    }

    // Validate dates if both are provided
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      if (endDate <= startDate) {
        throw { code: 'INVALID_DATES', message: 'End date must be after start date', statusCode: 400 };
      }
    }

    // Check name uniqueness if changing name
    if (data.name && data.name !== season.name) {
      const existing = await SeasonModel.getByName(data.name);
      if (existing) {
        throw { code: 'SEASON_EXISTS', message: 'A season with this name already exists', statusCode: 400 };
      }
    }

    return SeasonModel.update(id, data);
  }

  static async delete(id: number): Promise<boolean> {
    const season = await SeasonModel.getById(id);
    if (!season) {
      throw { code: 'SEASON_NOT_FOUND', message: 'Season not found', statusCode: 404 };
    }

    return SeasonModel.delete(id);
  }

  static async setAsCurrent(id: number): Promise<boolean> {
    const season = await SeasonModel.getById(id);
    if (!season) {
      throw { code: 'SEASON_NOT_FOUND', message: 'Season not found', statusCode: 404 };
    }

    return SeasonModel.setAsCurrent(id);
  }

  static async getSeasonStats(seasonId: number) {
    const season = await SeasonModel.getById(seasonId);
    if (!season) {
      throw { code: 'SEASON_NOT_FOUND', message: 'Season not found', statusCode: 404 };
    }

    return SeasonModel.getSeasonStats(seasonId);
  }
}
