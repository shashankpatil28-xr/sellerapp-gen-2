import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component'; // Import Login Component
import { AiChatInterfaceComponent } from './components/ai-chat-interface/ai-chat-interface.component'; // Import AI Chat Component

// const routes: Routes = [
//   { path: 'login', component: LoginComponent },
//   { path: 'chat', component: AiChatInterfaceComponent }, // This will be the main chat interface
//   { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default route to login
//   { path: '**', redirectTo: '/login' } // Wildcard route for any other path
// ];

// 
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'chat', component: AiChatInterfaceComponent
    // , canActivate: [AuthGuard] // COMMENTED OUT: Remove auth guard
  },
  // Default route - automatically redirect to chat
  { path: '', redirectTo: '/chat', pathMatch: 'full' },
  // Wildcard route for any other invalid paths, redirect to chat
  { path: '**', redirectTo: '/chat' }
];

export default routes;