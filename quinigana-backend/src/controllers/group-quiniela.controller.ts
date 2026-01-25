import { Request, Response } from 'express';
import { GroupQuinielaModel } from '../models/group-quiniela.model';
import { GroupModel } from '../models/group.model';
import { sendSuccess, sendError } from '../utils/response.util';

export class GroupQuinielaController {
  // Get active quinielas for user's groups
  static async getMyActiveQuinielas(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const quinielas = await GroupQuinielaModel.getActiveForUser(userId);
      sendSuccess(res, quinielas);
    } catch (err) {
      console.error('Get active quinielas error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener quinielas activas', 500);
    }
  }

  // Get quiniela details with matches
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const quinielaId = parseInt(req.params.id as string);
      const userId = req.authUser!.userId;

      const quiniela = await GroupQuinielaModel.getWithDetails(quinielaId);
      if (!quiniela) {
        sendError(res, 'NOT_FOUND', 'Quiniela no encontrada', 404);
        return;
      }

      // Check if user is member of the group
      const isMember = await GroupQuinielaModel.isUserMemberOfQuinielaGroup(quinielaId, userId);
      if (!isMember) {
        sendError(res, 'FORBIDDEN', 'No tienes acceso a esta quiniela', 403);
        return;
      }

      const matches = await GroupQuinielaModel.getMatches(quinielaId);
      const myPredictions = await GroupQuinielaModel.getUserPredictions(quinielaId, userId);

      sendSuccess(res, {
        ...quiniela,
        matches,
        myPredictions
      });
    } catch (err) {
      console.error('Get quiniela error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener quiniela', 500);
    }
  }

  // Get all quinielas for a group
  static async getByGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupId = parseInt(req.params.groupId as string);
      const userId = req.authUser!.userId;

      // Check if user is member of the group
      const isMember = await GroupModel.isMember(groupId, userId);
      if (!isMember) {
        sendError(res, 'FORBIDDEN', 'No eres miembro de este grupo', 403);
        return;
      }

      const quinielas = await GroupQuinielaModel.findByGroup(groupId);
      sendSuccess(res, quinielas);
    } catch (err) {
      console.error('Get group quinielas error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener quinielas del grupo', 500);
    }
  }

  // Create a new quiniela for a group
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.authUser!.userId;
      const { group_id, name, description, deadline, matches } = req.body;

      if (!group_id || !name || !deadline || !matches || matches.length === 0) {
        sendError(res, 'VALIDATION_ERROR', 'Faltan campos requeridos', 400);
        return;
      }

      // Check if user is member/admin of the group
      const isMember = await GroupModel.isMember(group_id, userId);
      if (!isMember) {
        sendError(res, 'FORBIDDEN', 'No eres miembro de este grupo', 403);
        return;
      }

      const quinielaId = await GroupQuinielaModel.create({
        group_id,
        name,
        description,
        deadline,
        matches
      }, userId);

      const quiniela = await GroupQuinielaModel.getWithDetails(quinielaId);
      sendSuccess(res, quiniela, 'Quiniela creada exitosamente', 201);
    } catch (err) {
      console.error('Create quiniela error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al crear quiniela', 500);
    }
  }

  // Save user predictions
  static async savePredictions(req: Request, res: Response): Promise<void> {
    try {
      const quinielaId = parseInt(req.params.id as string);
      const userId = req.authUser!.userId;
      const { predictions } = req.body;

      if (!predictions || predictions.length === 0) {
        sendError(res, 'VALIDATION_ERROR', 'No hay predicciones', 400);
        return;
      }

      // Check if user is member
      const isMember = await GroupQuinielaModel.isUserMemberOfQuinielaGroup(quinielaId, userId);
      if (!isMember) {
        sendError(res, 'FORBIDDEN', 'No tienes acceso a esta quiniela', 403);
        return;
      }

      // Check if quiniela is still open
      const quiniela = await GroupQuinielaModel.findById(quinielaId);
      if (!quiniela) {
        sendError(res, 'NOT_FOUND', 'Quiniela no encontrada', 404);
        return;
      }
      if (quiniela.status !== 'open') {
        sendError(res, 'CLOSED', 'La quiniela ya esta cerrada', 400);
        return;
      }
      if (new Date(quiniela.deadline) < new Date()) {
        sendError(res, 'DEADLINE_PASSED', 'El plazo ha terminado', 400);
        return;
      }

      await GroupQuinielaModel.savePredictions(quinielaId, userId, predictions);
      const updated = await GroupQuinielaModel.getUserPredictions(quinielaId, userId);
      sendSuccess(res, updated, 'Predicciones guardadas');
    } catch (err) {
      console.error('Save predictions error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al guardar predicciones', 500);
    }
  }

  // Submit results (admin/creator only)
  static async submitResults(req: Request, res: Response): Promise<void> {
    try {
      const quinielaId = parseInt(req.params.id as string);
      const userId = req.authUser!.userId;
      const { results } = req.body;

      if (!results || results.length === 0) {
        sendError(res, 'VALIDATION_ERROR', 'No hay resultados', 400);
        return;
      }

      // Check if user can manage
      const canManage = await GroupQuinielaModel.canManageQuiniela(quinielaId, userId);
      if (!canManage) {
        sendError(res, 'FORBIDDEN', 'No tienes permisos para enviar resultados', 403);
        return;
      }

      await GroupQuinielaModel.submitResults(quinielaId, results);
      await GroupQuinielaModel.calculateScores(quinielaId);
      await GroupQuinielaModel.updateStatus(quinielaId, 'finished');

      const ranking = await GroupQuinielaModel.getRanking(quinielaId);
      sendSuccess(res, { ranking }, 'Resultados enviados y puntuaciones calculadas');
    } catch (err) {
      console.error('Submit results error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al enviar resultados', 500);
    }
  }

  // Get ranking for a quiniela
  static async getRanking(req: Request, res: Response): Promise<void> {
    try {
      const quinielaId = parseInt(req.params.id as string);
      const userId = req.authUser!.userId;

      // Check if user is member
      const isMember = await GroupQuinielaModel.isUserMemberOfQuinielaGroup(quinielaId, userId);
      if (!isMember) {
        sendError(res, 'FORBIDDEN', 'No tienes acceso a esta quiniela', 403);
        return;
      }

      const ranking = await GroupQuinielaModel.getRanking(quinielaId);
      sendSuccess(res, ranking);
    } catch (err) {
      console.error('Get ranking error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener ranking', 500);
    }
  }

  // Close quiniela (admin/creator only)
  static async close(req: Request, res: Response): Promise<void> {
    try {
      const quinielaId = parseInt(req.params.id as string);
      const userId = req.authUser!.userId;

      const canManage = await GroupQuinielaModel.canManageQuiniela(quinielaId, userId);
      if (!canManage) {
        sendError(res, 'FORBIDDEN', 'No tienes permisos', 403);
        return;
      }

      await GroupQuinielaModel.updateStatus(quinielaId, 'closed');
      sendSuccess(res, { message: 'Quiniela cerrada' });
    } catch (err) {
      console.error('Close quiniela error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al cerrar quiniela', 500);
    }
  }

  // Delete quiniela (admin/creator only, if no predictions)
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const quinielaId = parseInt(req.params.id as string);
      const userId = req.authUser!.userId;

      const canManage = await GroupQuinielaModel.canManageQuiniela(quinielaId, userId);
      if (!canManage) {
        sendError(res, 'FORBIDDEN', 'No tienes permisos', 403);
        return;
      }

      await GroupQuinielaModel.delete(quinielaId);
      sendSuccess(res, { message: 'Quiniela eliminada' });
    } catch (err: any) {
      if (err.code === 'HAS_PREDICTIONS') {
        sendError(res, err.code, err.message, err.statusCode);
        return;
      }
      console.error('Delete quiniela error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al eliminar quiniela', 500);
    }
  }

  // Get all members' predictions for comparison
  static async getMembersPredictions(req: Request, res: Response): Promise<void> {
    try {
      const quinielaId = parseInt(req.params.id as string);
      const userId = req.authUser!.userId;

      // Check if user is member
      const isMember = await GroupQuinielaModel.isUserMemberOfQuinielaGroup(quinielaId, userId);
      if (!isMember) {
        sendError(res, 'FORBIDDEN', 'No tienes acceso a esta quiniela', 403);
        return;
      }

      const data = await GroupQuinielaModel.getMembersPredictions(quinielaId);
      sendSuccess(res, data);
    } catch (err) {
      console.error('Get members predictions error:', err);
      sendError(res, 'INTERNAL_ERROR', 'Error al obtener predicciones', 500);
    }
  }
}
