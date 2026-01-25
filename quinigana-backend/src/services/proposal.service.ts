import { ProposalModel } from '../models/proposal.model';
import { VoteModel } from '../models/vote.model';
import { GroupModel } from '../models/group.model';
import { JornadaModel } from '../models/jornada.model';
import { MatchModel } from '../models/match.model';
import { NotificationService } from './notification.service';
import { CreateProposalDto } from '../types';

export class ProposalService {
  static async createProposal(groupId: number, userId: number, data: CreateProposalDto) {
    const jornada = await JornadaModel.findById(data.jornada_id);
    if (!jornada) {
      throw new Error('Jornada not found');
    }
    if (jornada.status !== 'open') {
      throw new Error('Jornada is not open for proposals');
    }

    // Verificar que no haya pasado el deadline
    if (new Date(jornada.deadline) < new Date()) {
      throw new Error('El plazo para esta jornada ha finalizado');
    }

    // No permitir crear si ya hay una propuesta aprobada para este grupo/jornada
    const existingApproved = await ProposalModel.findApprovedByGroupAndJornada(groupId, data.jornada_id);
    if (existingApproved) {
      throw new Error('Este grupo ya tiene una quiniela aprobada para esta jornada');
    }

    const matches = await MatchModel.findByJornada(data.jornada_id);
    const matchIds = matches.map(m => m.id);
    for (const pred of data.predictions) {
      if (!matchIds.includes(pred.match_id)) {
        throw new Error(`Match ${pred.match_id} does not belong to this jornada`);
      }
    }

    const totalMembers = await GroupModel.getMemberCount(groupId);
    const proposalId = await ProposalModel.create(groupId, data.jornada_id, userId, data.title || null, totalMembers);
    await ProposalModel.addPredictions(proposalId, data.predictions);

    return ProposalModel.getWithDetails(proposalId, userId);
  }

  static async getProposals(groupId: number, page: number = 1, limit: number = 20) {
    const { items, total } = await ProposalModel.findByGroup(groupId, page, limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getProposalDetail(proposalId: number, userId: number) {
    return ProposalModel.getWithDetails(proposalId, userId);
  }

  static async updateProposal(proposalId: number, userId: number, data: { title?: string; predictions?: CreateProposalDto['predictions'] }) {
    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    if (proposal.proposed_by !== userId) {
      throw new Error('Only the proposer can edit this proposal');
    }
    if (proposal.status !== 'draft') {
      throw new Error('Only draft proposals can be edited');
    }

    // Verificar que no haya pasado el deadline
    const jornada = await JornadaModel.findById(proposal.jornada_id);
    if (jornada && new Date(jornada.deadline) < new Date()) {
      throw new Error('El plazo para esta jornada ha finalizado');
    }

    if (data.title) {
      await ProposalModel.updateTitle(proposalId, data.title);
    }
    if (data.predictions) {
      await ProposalModel.updatePredictions(proposalId, data.predictions);
    }

    return ProposalModel.getWithDetails(proposalId, userId);
  }

  static async submitForVoting(proposalId: number, userId: number) {
    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    if (proposal.proposed_by !== userId) {
      throw new Error('Only the proposer can submit for voting');
    }
    if (proposal.status !== 'draft') {
      throw new Error('Only draft proposals can be submitted');
    }

    // Verificar que no haya pasado el deadline
    const jornada = await JornadaModel.findById(proposal.jornada_id);
    if (jornada && new Date(jornada.deadline) < new Date()) {
      throw new Error('El plazo para esta jornada ha finalizado');
    }

    // Verificar que no haya otra propuesta activa (pending o approved)
    const existingActive = await ProposalModel.findActiveByGroupAndJornada(proposal.group_id, proposal.jornada_id);
    if (existingActive) {
      if (existingActive.status === 'approved') {
        throw new Error('Este grupo ya tiene una quiniela aprobada para esta jornada');
      } else {
        throw new Error('Ya hay una propuesta en votación para esta jornada. Espera a que se resuelva.');
      }
    }

    // If only 1 member in the group, auto-approve
    const memberCount = await GroupModel.getMemberCount(proposal.group_id);
    if (memberCount <= 1) {
      await ProposalModel.updateStatus(proposalId, 'approved');
      return ProposalModel.getWithDetails(proposalId, userId);
    }

    await ProposalModel.updateStatus(proposalId, 'pending');

    // Notify group members about new proposal for voting
    GroupModel.getMembers(proposal.group_id).then(async members => {
      const group = await GroupModel.findById(proposal.group_id);
      const proposer = members.find(m => m.user_id === userId);
      const proposerName = proposer ? `${proposer.first_name} ${proposer.last_name || ''}`.trim() : 'Un miembro';
      const memberIds = members.filter(m => m.user_id !== userId).map(m => m.user_id);
      if (group && memberIds.length > 0) {
        NotificationService.notifyProposalSubmitted(group.name, proposerName, memberIds, proposal.group_id, proposalId).catch(() => {});
      }
    });

    return ProposalModel.getWithDetails(proposalId, userId);
  }

  static async vote(proposalId: number, userId: number, vote: 'approve' | 'reject') {
    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    if (proposal.status !== 'pending') {
      throw new Error('This proposal is not open for voting');
    }

    const isMember = await GroupModel.isMember(proposal.group_id, userId);
    if (!isMember) {
      throw new Error('You are not a member of this group');
    }

    const existingVote = await VoteModel.findByProposalAndUser(proposalId, userId);
    if (existingVote) {
      throw new Error('You have already voted on this proposal');
    }

    await VoteModel.create(proposalId, userId, vote);

    const { votesFor, votesAgainst } = await VoteModel.countVotes(proposalId);
    await ProposalModel.updateVoteCounts(proposalId, votesFor, votesAgainst);

    const totalMembers = proposal.total_members_at_creation;
    const majority = Math.floor(totalMembers / 2) + 1;

    if (votesFor >= majority) {
      await ProposalModel.updateStatus(proposalId, 'approved');
    } else if (votesAgainst >= majority) {
      await ProposalModel.updateStatus(proposalId, 'rejected');
    }

    return ProposalModel.getWithDetails(proposalId, userId);
  }

  static async deleteProposal(proposalId: number, userId: number) {
    const proposal = await ProposalModel.findById(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    if (proposal.proposed_by !== userId) {
      throw new Error('Only the proposer can delete this proposal');
    }
    if (proposal.status === 'approved') {
      throw new Error('Cannot delete an approved proposal');
    }

    await ProposalModel.delete(proposalId);
  }
}
