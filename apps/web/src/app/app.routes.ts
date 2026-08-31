import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

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
    path: '',
    canActivate: [authGuard],
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
    ],
  },
  { path: '**', redirectTo: '' },
];
