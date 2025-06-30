// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AiChatInterfaceComponent } from './components/ai-chat-interface/ai-chat-interface.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component'; // NEW: Import MainLayoutComponent

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '', // This acts as a base for authenticated routes
    component: MainLayoutComponent, // This component contains the sidebar and a router-outlet
    children: [
      { path: 'chat', component: AiChatInterfaceComponent },
      // Add other authenticated routes here, e.g.,
      // { path: 'dashboard', component: DashboardComponent },
      // { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'chat', pathMatch: 'full' } // Default child route for authenticated section
    ]
  },
  { path: '**', redirectTo: '/login' } // Redirect any other unknown path to login
];

export default routes;