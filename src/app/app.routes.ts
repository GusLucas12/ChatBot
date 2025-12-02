import { Routes } from '@angular/router';
import { ChatbotComponent } from './components/chatbot/chatbot';

import { authGuard } from './guards/auth.guard-guard';

import { AdminComponent } from './components/admin/admin/admin';
import { Login } from './components/login/login';


export const routes: Routes = [
    { path: '', component: ChatbotComponent }, 
    { path: 'login', component: Login }, 
    
    { 
      path: 'admin', 
      component: AdminComponent,
  
    },

    { path: '**', redirectTo: '' } 
];