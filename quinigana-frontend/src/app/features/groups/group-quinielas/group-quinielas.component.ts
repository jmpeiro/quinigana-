import { Component, Input, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProposalService } from '../../../core/services/proposal.service';
import { QuinielaProposal } from '../../../core/models/proposal.model';

@Component({
  selector: 'app-group-quinielas',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="quinielas-container">
      <div class="quinielas-header">
        <h3>Quinielas del Grupo</h3>
        <button mat-raised-button color="primary" (click)="createProposal()">
          <mat-icon>add</mat-icon>
          Nueva Quiniela
        </button>
      </div>

      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else {
        <div class="quinielas-list">
          @for (proposal of proposals(); track proposal.id) {
            <div class="quiniela-card" (click)="goToProposal(proposal)">
              <div class="quiniela-info">
                <span class="quiniela-name">{{ proposal.jornada_name || 'Jornada' }}</span>
                <span class="quiniela-meta">
                  {{ proposal.title || 'Propuesta #' + proposal.id }}
                  @if (proposal.proposer_name) {
                    · por {{ proposal.proposer_name }}
                  }
                </span>
              </div>
              <div class="quiniela-right">
                <div class="status-chip" [class]="'status-' + proposal.status">
                  @switch (proposal.status) {
                    @case ('draft') {
                      <mat-icon>edit_note</mat-icon> Borrador
                    }
                    @case ('pending') {
                      <mat-icon>hourglass_top</mat-icon> Pendiente
                    }
                    @case ('approved') {
                      <mat-icon>check_circle</mat-icon> Aprobada
                    }
                    @case ('rejected') {
                      <mat-icon>cancel</mat-icon> Rechazada
                    }
                  }
                </div>
                <span class="votes">
                  <span class="votes-for">{{ proposal.votes_for }}</span> / <span class="votes-against">{{ proposal.votes_against }}</span> votos
                </span>
              </div>
              <mat-icon class="chevron">chevron_right</mat-icon>
            </div>
          } @empty {
            <div class="empty-state">
              <mat-icon>sports_soccer</mat-icon>
              <p>No hay quinielas creadas aun</p>
              <button mat-stroked-button (click)="createProposal()">
                <mat-icon>add</mat-icon>
                Crear primera quiniela
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .quinielas-container {
      padding: 1rem 0;
    }

    .quinielas-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .quinielas-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .quiniela-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 180ms ease;

      &:hover {
        border-color: #c8a84b;
        box-shadow: 0 2px 8px rgba(200, 168, 75, 0.15);
      }
    }

    .quiniela-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .quiniela-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
    }

    .quiniela-meta {
      font-size: 0.75rem;
      color: #64748b;
    }

    .quiniela-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .status-draft {
      background-color: #e2e8f0;
      color: #475569;
    }

    .status-pending {
      background-color: #fef3c7;
      color: #d97706;
    }

    .status-approved {
      background-color: #d1fae5;
      color: #059669;
    }

    .status-rejected {
      background-color: #fee2e2;
      color: #dc2626;
    }

    .votes {
      font-size: 0.7rem;
      color: #94a3b8;

      .votes-for {
        color: #10b981;
        font-weight: 600;
      }

      .votes-against {
        color: #ef4444;
        font-weight: 600;
      }
    }

    .chevron {
      color: #94a3b8;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #94a3b8;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
        margin-bottom: 0.5rem;
      }

      p {
        margin: 0 0 1rem;
        font-size: 0.9rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupQuinielasComponent implements OnInit {
  @Input() groupId!: number;

  private proposalService = inject(ProposalService);
  private router = inject(Router);

  proposals = signal<QuinielaProposal[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadProposals();
  }

  loadProposals(): void {
    this.loading.set(true);
    this.proposalService.getByGroup(this.groupId, 1, 50).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Solo mostrar propuestas aprobadas
          const approved = response.data.items.filter(p => p.status === 'approved');
          this.proposals.set(approved);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  createProposal(): void {
    this.router.navigate(['/quiniela/proposals/create'], {
      queryParams: { groupId: this.groupId }
    });
  }

  goToProposal(proposal: QuinielaProposal): void {
    this.router.navigate(['/groups', this.groupId, 'proposals', proposal.id]);
  }
}
