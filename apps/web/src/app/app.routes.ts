import { Routes } from '@angular/router';
import { athleteGuard, coachGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'connexion',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'inscription',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'moi',
    canActivate: [athleteGuard],
    loadComponent: () => import('./pages/athlete-shell.page').then((m) => m.AthleteShellPage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/me-today.page').then((m) => m.MeTodayPage),
      },
      {
        path: 'planning',
        loadComponent: () => import('./pages/me-planning.page').then((m) => m.MePlanningPage),
      },
      {
        path: 'progression',
        loadComponent: () => import('./pages/me-progression.page').then((m) => m.MeProgressionPage),
      },
      {
        path: 'activites/:id',
        loadComponent: () => import('./pages/activity-detail.page').then((m) => m.ActivityDetailPage),
      },
      {
        path: 'messages',
        loadComponent: () => import('./pages/messages.page').then((m) => m.MessagesPage),
      },
      {
        path: 'profil',
        loadComponent: () => import('./pages/me-profile.page').then((m) => m.MeProfilePage),
      },
    ],
  },
  {
    path: '',
    canActivate: [coachGuard],
    loadComponent: () => import('./pages/shell.page').then((m) => m.ShellPage),
    children: [
      {
        path: 'apercu',
        loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'athletes',
        loadComponent: () => import('./pages/athletes.page').then((m) => m.AthletesPage),
      },
      {
        path: 'athletes/:id',
        loadComponent: () => import('./pages/athlete-detail.page').then((m) => m.AthleteDetailPage),
      },
      {
        path: 'activites/:id',
        loadComponent: () => import('./pages/activity-detail.page').then((m) => m.ActivityDetailPage),
      },
      {
        path: 'planning',
        loadComponent: () => import('./pages/planning.page').then((m) => m.PlanningPage),
      },
      {
        path: 'bibliotheque',
        loadComponent: () => import('./pages/library.page').then((m) => m.LibraryPage),
      },
      {
        path: 'bibliotheque/nouvelle',
        loadComponent: () => import('./pages/template-editor.page').then((m) => m.TemplateEditorPage),
      },
      {
        path: 'messages',
        loadComponent: () => import('./pages/messages.page').then((m) => m.MessagesPage),
      },
      {
        path: 'integrations',
        loadComponent: () => import('./pages/integrations.page').then((m) => m.IntegrationsPage),
      },
      {
        path: 'equipe',
        loadComponent: () => import('./pages/team.page').then((m) => m.TeamPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
