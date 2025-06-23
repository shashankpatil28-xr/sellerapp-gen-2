import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AiChatInterfaceComponent } from './components/ai-chat-interface/ai-chat-interface.component';
import { CallbackComponent } from './components/callback/callback.component'; // <--- IMPORTANT: Import the Callback Component

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'chat', component: AiChatInterfaceComponent }, // This will be the main chat interface
  { path: 'callback', component: CallbackComponent }, // <--- NEW: Route for OAuth2/OIDC callback
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default route to login
  { path: '**', redirectTo: '/login' } // Wildcard route for any other path
];

export default routes;
