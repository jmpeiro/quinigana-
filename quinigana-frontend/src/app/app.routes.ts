import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
      },
      {
        path: 'google-callback',
        loadComponent: () => import('./features/auth/google-callback/google-callback.component').then(m => m.GoogleCallbackComponent),
      },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'groups',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/groups/group-list/group-list.component').then(m => m.GroupListComponent),
      },
      {
        path: 'create',
        loadComponent: () => import('./features/groups/group-create/group-create.component').then(m => m.GroupCreateComponent),
      },
      {
        path: 'invitations',
        loadComponent: () => import('./features/groups/invitations/invitations.component').then(m => m.InvitationsComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./features/groups/group-detail/group-detail.component').then(m => m.GroupDetailComponent),
      },
      {
        path: ':id/quiniela/:quinielaId',
        loadComponent: () => import('./features/groups/group-quinielas/play-quiniela.component').then(m => m.PlayQuinielaComponent),
      },
      {
        path: ':id/activity',
        loadComponent: () => import('./features/groups/group-activity/group-activity.component').then(m => m.GroupActivityComponent),
      },
      {
        path: ':id/invite',
        loadComponent: () => import('./features/groups/group-invite/group-invite.component').then(m => m.GroupInviteComponent),
      },
      {
        path: ':id/comparison/:jornadaId',
        loadComponent: () => import('./features/groups/group-comparison/group-comparison.component').then(m => m.GroupComparisonComponent),
      },
    ],
  },
  {
    path: 'quiniela',
    canActivate: [authGuard],
    children: [
      {
        path: 'jornadas',
        loadComponent: () => import('./features/quiniela/jornada-list/jornada-list.component').then(m => m.JornadaListComponent),
      },
      {
        path: 'jornadas/:id',
        loadComponent: () => import('./features/quiniela/jornada-detail/jornada-detail.component').then(m => m.JornadaDetailComponent),
      },
      {
        path: 'proposals/create',
        loadComponent: () => import('./features/quiniela/proposal-create/proposal-create.component').then(m => m.ProposalCreateComponent),
      },
      {
        path: 'groups/:groupId/proposals/:proposalId',
        loadComponent: () => import('./features/quiniela/proposal-detail/proposal-detail.component').then(m => m.ProposalDetailComponent),
      },
      {
        path: 'groups/:groupId/scores',
        loadComponent: () => import('./features/quiniela/scores/scores.component').then(m => m.ScoresComponent),
      },
    ],
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notifications/notification-list/notification-list.component').then(m => m.NotificationListComponent),
  },
  {
    path: 'challenges',
    canActivate: [authGuard],
    loadComponent: () => import('./features/challenges/challenges.component').then(m => m.ChallengesComponent),
  },
  {
    path: 'leagues',
    canActivate: [authGuard],
    loadComponent: () => import('./features/leagues/leagues.component').then(m => m.LeaguesComponent),
  },
  {
    path: 'stats',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/stats/personal-stats/personal-stats.component').then(m => m.PersonalStatsComponent),
      },
      {
        path: 'predictions',
        loadComponent: () => import('./features/stats/prediction-history/prediction-history.component').then(m => m.PredictionHistoryComponent),
      },
      {
        path: 'groups/:groupId/history',
        loadComponent: () => import('./features/stats/group-history/group-history.component').then(m => m.GroupHistoryComponent),
      },
      {
        path: 'groups/:groupId/jornadas/:jornadaId',
        loadComponent: () => import('./features/stats/jornada-detail-results/jornada-detail-results.component').then(m => m.JornadaDetailResultsComponent),
      },
      {
        path: 'groups/:groupId/rankings',
        loadComponent: () => import('./features/stats/group-rankings/group-rankings.component').then(m => m.GroupRankingsComponent),
      },
      {
        path: 'global-rankings',
        loadComponent: () => import('./features/stats/global-rankings/global-rankings.component').then(m => m.GlobalRankingsComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent),
      },
      {
        path: 'groups',
        loadComponent: () => import('./features/admin/group-management/group-management.component').then(m => m.GroupManagementComponent),
      },
      {
        path: 'jornadas',
        loadComponent: () => import('./features/admin/jornada-manage/jornada-manage.component').then(m => m.JornadaManageComponent),
      },
      {
        path: 'seasons',
        loadComponent: () => import('./features/admin/season-management/season-management.component').then(m => m.SeasonManagementComponent),
      },
    ],
  },
  {
    path: 'invite/:token',
    loadComponent: () => import('./features/groups/invite-accept/invite-accept.component').then(m => m.InviteAcceptComponent),
  },
  {
    path: 'error/500',
    loadComponent: () => import('./features/error-pages/server-error.component').then(m => m.ServerErrorComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./features/error-pages/not-found.component').then(m => m.NotFoundComponent),
  },
];
