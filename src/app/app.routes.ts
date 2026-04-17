import { Routes } from '@angular/router';
import { ProjectsComponent } from './components/projects/projects.component';
import { StoriesComponent } from './components/stories/stories.component';
import { TasksComponent } from './components/tasks/tasks.component';
import { TaskDetailsComponent } from './components/task-details/task-details.component';
import { KanbanComponent } from './components/kanban/kanban.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { NotificationDetailsComponent } from './components/notification-details/notification-details.component';
import { LoginComponent } from './components/login/login.component';
import { PendingApprovalComponent } from './components/pending-approval/pending-approval.component';
import { BlockedComponent } from './components/blocked/blocked.component';
import { UsersComponent } from './components/users/users.component';
import {
  adminGuard,
  approvedGuard,
  authGuard,
  blockedViewGuard,
  loginPageGuard,
  pendingViewGuard,
} from './guards/auth.guards';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginPageGuard] },
  {
    path: 'pending-approval',
    component: PendingApprovalComponent,
    canActivate: [pendingViewGuard],
  },
  { path: 'blocked', component: BlockedComponent, canActivate: [blockedViewGuard] },

  { path: '', component: StoriesComponent, canActivate: [authGuard, approvedGuard] },
  { path: 'projects', component: ProjectsComponent, canActivate: [authGuard, approvedGuard] },
  { path: 'tasks', component: TasksComponent, canActivate: [authGuard, approvedGuard] },
  { path: 'tasks/:id', component: TaskDetailsComponent, canActivate: [authGuard, approvedGuard] },
  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [authGuard, approvedGuard],
  },
  {
    path: 'notifications/:id',
    component: NotificationDetailsComponent,
    canActivate: [authGuard, approvedGuard],
  },
  { path: 'kanban', component: KanbanComponent, canActivate: [authGuard, approvedGuard] },
  { path: 'users', component: UsersComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '' },
];
