import { Routes } from '@angular/router';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { AdminComponent } from './components/admin/admin/admin';


export const routes: Routes = [
    { path: '', component: ChatbotComponent }, // Página inicial (Chat)
    { path: 'admin', component: AdminComponent } // Página secreta (Admin)
];