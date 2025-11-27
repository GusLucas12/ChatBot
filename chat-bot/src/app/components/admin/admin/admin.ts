import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../../services/chat';
import { MetricsService } from '../../../services/metrics';
import { ChatFlow, ChatOption } from '../../../modules/chat.models';

// Interface auxiliar para facilitar a edição
interface EditableCard {
  id: string;
  text: string;
  options: ChatOption[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent implements OnInit {
  activeTab: 'dashboard' | 'editor' = 'dashboard';
  
  // Lista editável (Array é mais fácil pro *ngFor)
  cards: EditableCard[] = []; 
  
  isLoading = false;

  // Variáveis do Dashboard
  topInterests: any[] = [];
  totalInteractions = 0;

  constructor(
    private chatService: ChatService,
    private metricsService: MetricsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFlow();
    this.loadMetrics();
  }

  // --- Carregamento ---

  loadFlow() {
    this.isLoading = true;
    this.chatService.getFlow().subscribe({
      next: (data) => {
        // Converte o Objeto { start: {...}, doacao: {...} } para Array [ {id:'start'...} ]
        this.cards = Object.keys(data).map(key => ({
          id: key,
          text: data[key].text,
          options: data[key].options || []
        }));
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadMetrics() {
    this.metricsService.getAllMetrics().subscribe(data => {
      this.totalInteractions = data.length;
      // ... lógica de ranking igual ao anterior ...
    });
  }

  // --- Funções de Edição Visual ---

  addCard() {
    const newId = prompt('Nome do novo passo (ID sem espaços, ex: projetos):');
    if (newId) {
      // Validação simples para não duplicar IDs
      if (this.cards.find(c => c.id === newId)) {
        alert('Já existe um card com este ID!');
        return;
      }
      this.cards.push({ id: newId.toLowerCase().trim(), text: 'Nova mensagem...', options: [] });
    }
  }

  removeCard(index: number) {
    if (confirm('Tem certeza que quer apagar este card?')) {
      this.cards.splice(index, 1);
    }
  }

  addOption(card: EditableCard) {
    card.options.push({ label: 'Novo Botão', nextStep: 'start' });
  }

  removeOption(card: EditableCard, index: number) {
    card.options.splice(index, 1);
  }

  // --- Salvamento ---

 save() {
    this.isLoading = true;
    
    // 1. Converte o Array de cards para o Objeto que o script espera
    const flowToSave: ChatFlow = {};
    
    this.cards.forEach(card => {
      // Ignora cards sem ID
      if (!card.id) return;

      const cleanOptions = card.options.map(opt => {
        const newOpt: ChatOption = { label: opt.label };
        
        // O valor que a pessoa digitou no input (pode ser ID ou Link)
        // No HTML estamos usando [(ngModel)]="opt.nextStep", então pegamos de lá
        const valorDigitado = String(opt.nextStep || "").trim();

        // Lógica para decidir se é Link ou Próximo Passo
        if (valorDigitado.startsWith('http')) {
           // É um link externo
           newOpt.action = valorDigitado.includes('wa.me') ? 'whatsapp' : 'url';
           newOpt.payload = valorDigitado;
        } else {
           // É um passo interno (ID)
           newOpt.nextStep = valorDigitado;
        }
        
        return newOpt;
      });

      flowToSave[card.id] = {
        text: card.text,
        options: cleanOptions
      };
    });

    console.log('Enviando para o Google:', flowToSave); // Log para debug

    // 2. Envia para o Google
    this.chatService.saveFlow(flowToSave).subscribe({
      next: (res) => {
        console.log('Resposta do Google:', res);
        alert('Salvo com sucesso na Planilha!');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro detalhado:', err);
        alert('Erro ao salvar. Veja o console (F12) para detalhes.');
        this.isLoading = false;
      }
    });
  }

  goHome() { this.router.navigate(['/']); }
}