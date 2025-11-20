import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatFlow } from '../../../modules/chat.models';
import { ChatService } from '../../../services/chat';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent {
  flow: ChatFlow = {};
  objectKeys = Object.keys; // Para usar no HTML

  constructor(private chatService: ChatService, private router: Router) {
    // Carrega os dados atuais ao abrir a tela
    this.flow = this.chatService.getFlow();
  }

  save() {
    this.chatService.saveFlow(this.flow);
    alert('Texto atualizado com sucesso!');
  }

  reset() {
    if(confirm('Tem certeza? Isso apagará todas as edições da ONG.')) {
      this.chatService.resetFactory();
      this.flow = this.chatService.getFlow();
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }
}